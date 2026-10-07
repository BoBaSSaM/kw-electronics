import { Router } from "express";
import { RequestUploadUrlBody, RequestUploadUrlResponse } from "@workspace/api-zod";
import { ObjectStorageService } from "../lib/objectStorage";
import { adminOnly } from "../middlewares/storeSession";
import { db, uploadsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
const router=Router();
const storage=new ObjectStorageService();
router.post("/storage/uploads/request-url",adminOnly,async(req,res):Promise<void>=>{
  const input=RequestUploadUrlBody.safeParse(req.body);
  if(!input.success){res.status(400).json({error:"Choose a PNG, JPEG or WebP image smaller than 5 MB."});return;}
  const uploadURL=await storage.getObjectEntityUploadURL();
  const objectPath=storage.normalizeObjectEntityPath(uploadURL);
  await db.insert(uploadsTable).values({path:objectPath,owner:req.storeUser!.id,contentType:input.data.contentType,size:input.data.size});
  res.json(RequestUploadUrlResponse.parse({uploadURL,objectPath:`/api/storage${objectPath}`}));
});
router.get("/storage/objects/{*path}",async(req,res):Promise<void>=>{
  try{
    const path=Array.isArray(req.params.path)?req.params.path.join("/"):req.params.path;
    const objectPath=`/objects/${path}`;
    const [upload]=await db.select().from(uploadsTable).where(eq(uploadsTable.path,objectPath));
    if(!upload){res.status(404).json({error:"Image not found"});return;}
    const file=await storage.getObjectEntityFile(objectPath);
    const [metadata]=await file.getMetadata();
    if(!["image/png","image/jpeg","image/webp"].includes(metadata.contentType||"")||Number(metadata.size)>5242880){
      res.status(404).json({error:"Image not found"});return;
    }
    const response=await storage.downloadObject(file);
    res.setHeader("Content-Type",metadata.contentType!);
    res.setHeader("X-Content-Type-Options","nosniff");
    res.setHeader("Cache-Control","public, max-age=3600");
    res.send(Buffer.from(await response.arrayBuffer()));
  }catch{res.status(404).json({error:"Image not found"});}
});
export default router;
