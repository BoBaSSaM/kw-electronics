import { useEffect, useRef, type ReactNode } from 'react';
import { ClerkProvider, SignIn, SignUp, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LangProvider, useLang } from '@/lib/i18n';
import { ShopProvider } from '@/lib/shop';
import { Layout } from '@/components/Layout';
import { Logo } from '@/components/bits';
import Home from '@/pages/home';
import Products from '@/pages/products';
import ProductDetail from '@/pages/product-detail';
import Categories from '@/pages/categories';
import Brands from '@/pages/brands';
import Wishlist from '@/pages/wishlist';
import Compare from '@/pages/compare';
import CartPage from '@/pages/cart';
import Checkout from '@/pages/checkout';
import Account from '@/pages/account';
import OrderDetail from '@/pages/order-detail';
import Admin from '@/pages/admin';
import About from '@/pages/about';
import Contact from '@/pages/contact';
import Info from '@/pages/info';
import NotFound from '@/pages/not-found';

const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
function stripBase(path: string): string { return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path; }
if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 15000, refetchOnWindowFocus: false } } });

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: { logoPlacement: 'inside' as const, logoLinkUrl: basePath || '/', logoImageUrl: `${window.location.origin}${basePath}/logo.svg` },
  variables: { colorPrimary: '#0B3D91', colorForeground: '#172033', colorMutedForeground: '#667085', colorDanger: '#d92d20', colorBackground: '#ffffff', colorInput: '#F7F9FC', colorInputForeground: '#172033', colorNeutral: '#172033', fontFamily: 'Manrope, Cairo, sans-serif', borderRadius: '0.75rem' },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-white rounded-3xl w-[440px] max-w-full overflow-hidden shadow-2xl shadow-blue-900/20 border border-[#e4e9f2]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#172033] font-bold', headerSubtitle: 'text-[#667085]', socialButtonsBlockButtonText: 'text-[#172033] font-semibold',
    formFieldLabel: 'text-[#172033] font-semibold', footerActionLink: 'text-[#146CFF] font-semibold', footerActionText: 'text-[#667085]', dividerText: 'text-[#667085]',
    identityPreviewEditButton: 'text-[#146CFF]', formFieldSuccessText: 'text-emerald-700', alertText: 'text-[#172033]',
    logoBox: 'h-12 justify-center', logoImage: 'h-12 w-12', socialButtonsBlockButton: 'border border-[#d5dbe8] bg-white hover:bg-[#F7F9FC]',
    formButtonPrimary: 'bg-[#0B3D91] hover:bg-[#146CFF] text-white font-semibold', formFieldInput: 'border border-[#d5dbe8] bg-[#F7F9FC]',
    footerAction: 'bg-transparent', dividerLine: 'bg-[#e4e9f2]', alert: 'bg-[#fff7e0]', otpCodeFieldInput: 'border border-[#d5dbe8]', formFieldRow: '', main: '',
  },
};

function AuthShell({ children }: { children: ReactNode }) {
  return (<div className="hero-grad relative flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-4 py-10"><div className="circuit-bg absolute inset-0 opacity-30" /><div className="relative"><Logo light /></div><div className="relative w-full">{children}</div></div>);
}
function SignInPage() { return <AuthShell><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></AuthShell>; }
function SignUpPage() { return <AuthShell><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></AuthShell>; }

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk(); const qc = useQueryClient(); const prev = useRef<string | null | undefined>(undefined);
  useEffect(() => addListener(({ user }) => { const id = user?.id ?? null; if (prev.current !== undefined && prev.current !== id) qc.clear(); prev.current = id; }), [addListener, qc]);
  return null;
}

function Pages() {
  const [loc] = useLocation();
  return (
    <ErrorBoundary resetKey={loc}>
      <Switch>
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route>
          <Layout>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/products" component={() => <Products />} />
              <Route path="/products/:slug" component={ProductDetail} />
              <Route path="/categories" component={Categories} />
              <Route path="/brands" component={Brands} />
              <Route path="/new-arrivals" component={() => <Products mode="new" />} />
              <Route path="/offers" component={() => <Products mode="offers" />} />
              <Route path="/wishlist" component={Wishlist} />
              <Route path="/compare" component={Compare} />
              <Route path="/cart" component={CartPage} />
              <Route path="/checkout" component={Checkout} />
              <Route path="/account" component={Account} />
              <Route path="/orders/:id" component={OrderDetail} />
              <Route path="/admin" component={Admin} />
              <Route path="/about" component={About} />
              <Route path="/contact" component={Contact} />
              <Route path="/shipping" component={() => <Info kind="shipping" />} />
              <Route path="/returns" component={() => <Info kind="returns" />} />
              <Route path="/privacy" component={() => <Info kind="privacy" />} />
              <Route path="/terms" component={() => <Info kind="terms" />} />
              <Route path="/faq" component={() => <Info kind="faq" />} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        </Route>
      </Switch>
    </ErrorBoundary>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  const { tr } = useLang();
  return (
    <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`}
      localization={{ signIn: { start: { title: tr('Welcome back', 'مرحباً بعودتك'), subtitle: tr('Sign in to Circuit Kuwait', 'سجّل الدخول إلى سيركت الكويت') } }, signUp: { start: { title: tr('Create your account', 'أنشئ حسابك'), subtitle: tr('Track orders and save addresses', 'تتبع الطلبات واحفظ العناوين') } } }}
      routerPush={(to) => setLocation(stripBase(to))} routerReplace={(to) => setLocation(stripBase(to), { replace: true })}>
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <ShopProvider><TooltipProvider><Pages /><Toaster /></TooltipProvider></ShopProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (<LangProvider><WouterRouter base={basePath}><ClerkProviderWithRoutes /></WouterRouter></LangProvider>);
}
export default App;
