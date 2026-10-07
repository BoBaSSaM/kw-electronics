import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddressInputGovernorate, type AddressInput } from '@workspace/api-client-react';
import { useLang } from '@/lib/i18n';

export const emptyAddress: AddressInput = { label: '', governorate: 'Al Asimah', area: '', block: '', street: '', avenue: '', building: '', floor: '', apartment: '', instructions: '' };
export const addressValid = (a: AddressInput) => !!(a.area.trim() && a.block.trim() && a.street.trim() && a.building.trim());

export function AddressForm({ value, onChange, showLabel = false }: { value: AddressInput; onChange: (a: AddressInput) => void; showLabel?: boolean }) {
  const { tr } = useLang();
  const f = (k: keyof AddressInput, l: string, req = false) => (
    <div className="space-y-1.5"><Label>{l}{req && ' *'}</Label><Input value={(value[k] as string) ?? ''} onChange={(e) => onChange({ ...value, [k]: e.target.value })} data-testid={`input-addr-${k}`} /></div>);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {showLabel && <div className="sm:col-span-2">{f('label', tr('Label (e.g. Home, Workshop)', 'التسمية (مثال: المنزل)'))}</div>}
      <div className="space-y-1.5"><Label>{tr('Governorate', 'المحافظة')} *</Label>
        <Select value={value.governorate} onValueChange={(v) => onChange({ ...value, governorate: v as AddressInput['governorate'] })}>
          <SelectTrigger data-testid="select-governorate"><SelectValue /></SelectTrigger>
          <SelectContent>{Object.values(AddressInputGovernorate).map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></div>
      {f('area', tr('Area', 'المنطقة'), true)}{f('block', tr('Block', 'القطعة'), true)}{f('street', tr('Street', 'الشارع'), true)}
      {f('avenue', tr('Avenue (optional)', 'الجادة (اختياري)'))}{f('building', tr('Building / House', 'المبنى / المنزل'), true)}
      {f('floor', tr('Floor', 'الدور'))}{f('apartment', tr('Apartment', 'الشقة'))}
      <div className="space-y-1.5 sm:col-span-2"><Label>{tr('Delivery instructions', 'تعليمات التوصيل')}</Label><Textarea rows={2} value={value.instructions ?? ''} onChange={(e) => onChange({ ...value, instructions: e.target.value })} data-testid="input-addr-instructions" /></div>
    </div>
  );
}
