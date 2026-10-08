import React, { useState } from 'react';
import { Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Page, Button, Field, Heading } from '@/components/business/ui';
import { ActionPressable } from '@/components/ui/action-pressable';
import { Dialog } from '@/components/ui/dialog';
import { useDesignColors } from '@/constants/design';
import type { ButtonVariant } from '@/constants/button-styles';
export default function Audit() {
 const c = useDesignColors(); const [open,setOpen]=useState(false); const [count,setCount]=useState(0);
 return <Page><Heading>Verificación de controles</Heading><Text style={{color:c.text}}>Acciones: {count}</Text>
 {(['primary','secondary','outline','ghost','destructive'] as ButtonVariant[]).map(variant=> <React.Fragment key={variant}>
  <Button title={variant} variant={variant} onPress={()=>setCount(count+1)} icon={color=><Ionicons name="checkmark" size={20} color={color} />} />
  <Button title={`${variant} disabled`} variant={variant} disabled onPress={()=>setCount(count+1)} />
  <Button title={`${variant} loading`} variant={variant} loading onPress={()=>setCount(count+1)} />
 </React.Fragment>)}
 <Button title="Seleccionado" variant="outline" selected onPress={()=>{}} />
 <ActionPressable accessibilityLabel="Control combinado" className="p-4 rounded-xl bg-surface" style={{backgroundColor:c.primary}}><Text style={{color:c.onPrimary}}>Acción con fondo explícito</Text></ActionPressable>
 <ActionPressable accessibilityLabel="Acción deshabilitada" disabled className="p-4 rounded-xl bg-primary"><Text style={{color:c.onPrimary}}>Acción deshabilitada</Text></ActionPressable>
 <Field label="Cliente" value="" /><Field label="Precio" value="incorrecto" error="Ingresa un precio válido." />
 <Button title="Abrir diálogo" onPress={()=>setOpen(true)} /><Dialog visible={open} title="Confirmar cambios" onClose={()=>setOpen(false)}><Button title="Guardar cambios" onPress={()=>setOpen(false)} /><Button title="Cancelar" variant="outline" onPress={()=>setOpen(false)} /></Dialog>
 </Page>;
}
