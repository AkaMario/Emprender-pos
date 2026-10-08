import { useRouter } from 'expo-router';
import { Dialog } from '@/components/ui/dialog';
import { Button, Copy } from '@/components/business/ui';
export default function ModalScreen() {
  const router = useRouter();
  const close = () => { if (router.canGoBack()) router.back(); else router.replace('/'); };
  return <Dialog visible title="Información" onClose={close}><Copy>Gestiona tu emprendimiento desde las secciones del menú.</Copy><Button title="Cerrar" onPress={close} /></Dialog>;
}
