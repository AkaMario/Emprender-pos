import { Button } from "@/components/ui/button";
import { useDesignColors } from "@/constants/design";
import { ActionPressable as Pressable } from "@/components/ui/action-pressable";
import { useFormProtection } from "@/hooks/use-form-protection";
import { AppAlert as Alert } from "@/components/ui/alerts";
import { AppInput, AutoField } from "@/components/ui/form-input";
import { ScreenScroll } from "@/components/ui/screen-scroll";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import * as Crypto from "expo-crypto";
import {
  Text,
  View,
} from "react-native";
import {
  createCompletedSale,
  formatCurrency,
  getCustomers,
  getDishes,
  getNextSaleNumber,
  getQrImageUri,
  type Customer,
  type Dish,
  type OrderType,
  type PaymentMethod,
} from "@/database/pos-database";

type CartItem = {
  dish: Dish;
  quantity: number;
};

const orderTypes: OrderType[] = ["Mesa", "Domicilio", "Para Llevar"];
const paymentMethods: PaymentMethod[] = ["Efectivo", "Transferencia"];
const DELIVERY_FEE = 6000;

function formatCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return `$${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export function PosScreen() {
  const c = useDesignColors();
  const operationKey = useRef(Crypto.randomUUID());
  const router = useRouter();
  const [saleNumber, setSaleNumber] = useState("V-0001");
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("Mesa");
  const [tableNumber, setTableNumber] = useState("");
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Efectivo");
  const [amountReceived, setAmountReceived] = useState("");
  const [transferReference, setTransferReference] = useState("");
  const [transferQrUri, setTransferQrUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { dialog, markSaved } = useFormProtection([cart, tableNumber, customerName, amountReceived, transferReference], saving);
  const loadData = useCallback(async () => {
    const [nextNumber, nextDishes, nextCustomers, qrUri] = await Promise.all([
      getNextSaleNumber(),
      getDishes({ search }),
      getCustomers(),
      getQrImageUri(),
    ]);

    setSaleNumber(nextNumber);
    setDishes(nextDishes);
    setCustomers(nextCustomers);
    setTransferQrUri(qrUri);
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const subtotal = useMemo(
    () =>
      cart.reduce((total, item) => total + item.dish.price * item.quantity, 0),
    [cart],
  );
  const deliveryFee = orderType === "Domicilio" ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;
  const changeAmount =
    paymentMethod === "Efectivo" ? Number(amountReceived || 0) - total : 0;

  function addDish(dish: Dish) {
    if (dish.stockStatus === "Sin Stock") {
      return;
    }
    operationKey.current = Crypto.randomUUID();

    setCart((current) => {
      const existing = current.find((item) => item.dish.id === dish.id);

      if (existing) {
        return current.map((item) =>
          item.dish.id === dish.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...current, { dish, quantity: 1 }];
    });
  }

  function updateQuantity(dishId: number, delta: number) {
    operationKey.current = Crypto.randomUUID();
    setCart((current) =>
      current
        .map((item) =>
          item.dish.id === dishId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeItem(dishId: number) {
    operationKey.current = Crypto.randomUUID();
    setCart((current) => current.filter((item) => item.dish.id !== dishId));
  }

  async function confirmSale() {
    if (saving) return;
    if (orderType === "Mesa" && !tableNumber.trim()) {
      Alert.alert("Mesa requerida", "Ingresa el numero de mesa.");
      return;
    }

    if (orderType === "Domicilio" && !customerId && !customerName.trim()) {
      Alert.alert(
        "Cliente requerido",
        "Selecciona o crea un cliente para domicilio.",
      );
      return;
    }

    setSaving(true);
    try {
      const saleId = await createCompletedSale({
        operationKey: operationKey.current,
        orderType,
        tableNumber: tableNumber.trim(),
        customerId,
        customerName: customerName.trim(),
        deliveryFee,
        paymentMethod,
        amountReceived:
          paymentMethod === "Efectivo"
            ? Number(amountReceived || 0)
            : undefined,
        transferReference:
          paymentMethod === "Transferencia" ? transferReference : undefined,
        items: cart.map((item) => ({
          dishId: item.dish.id,
          quantity: item.quantity,
        })),
      });

      Alert.alert(
        "Venta completada",
        `${saleNumber} fue registrada correctamente.`,
        [
          {
            text: "Ver detalle",
            onPress: () =>
              router.push({
                pathname: "/view/dashboard/sale-detail",
                params: { id: String(saleId) },
              } as any),
          },
        ],
      );
      markSaved([[], tableNumber, customerName, "", ""]);
      setCart([]);
      operationKey.current = Crypto.randomUUID();
      setAmountReceived("");
      setTransferReference("");
      await loadData();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "No se pudo registrar la venta.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenScroll
      className="flex-1 bg-background "
      contentContainerClassName="gap-5 px-4 py-5 pb-10"
      showsVerticalScrollIndicator={false}
    >{dialog}
      <Section title="Tipo de orden">
        <View className="flex-row flex-wrap gap-2">
          {orderTypes.map((item) => (
            <Choice
              key={item}
              label={item}
              selected={orderType === item}
              onPress={() => setOrderType(item)}
            />
          ))}
        </View>
        {orderType === "Mesa" ? (
          <Input
            value={tableNumber}
            onChangeText={setTableNumber}
            placeholder="Numero de mesa"
          />
        ) : null}
        {orderType === "Domicilio" ? (
          <View className="gap-3">
            <ScreenScroll horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {customers.map((customer) => (
                  <Choice
                    key={customer.id}
                    label={customer.name}
                    selected={customerId === customer.id}
                    onPress={() => {
                      setCustomerId(customer.id);
                      setCustomerName(customer.name);
                    }}
                  />
                ))}
              </View>
            </ScreenScroll>
            <Input
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Crear cliente nuevo"
            />
          </View>
        ) : null}
        {orderType === "Para Llevar" ? (
          <Input
            value={customerName}
            onChangeText={setCustomerName}
            placeholder="Nombre del cliente (opcional)"
          />
        ) : null}
      </Section>

      <Section title="Agregar platos">
        <View className="flex-row items-center gap-2 rounded-none bg-surface px-3 ">
          <MaterialIcons name="search" size={22} color={c.icon} />
          <AppInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar plato"
            className="flex-1 py-3 text-base font-semibold text-text "
          />
        </View>
        {dishes.map((dish) => (
          <Pressable
            key={dish.id}
            disabled={dish.stockStatus === "Sin Stock"}
            onPress={() => addDish(dish)}
            className="flex-row items-center gap-3 rounded-none bg-surface p-3 active:bg-surfaceElevated "
            style={{ opacity: dish.stockStatus === "Sin Stock" ? 0.5 : 1 }}
          >
            <View className="flex-1">
              <Text className="font-semibold text-text ">
                {dish.name}
              </Text>
              <Text className="text-xs font-bold text-muted">
                {[dish.size, dish.stockStatus].filter(Boolean).join(" · ")}
              </Text>
            </View>
            <Text className="font-semibold text-text ">
              {formatCurrency(dish.price)}
            </Text>
          </Pressable>
        ))}
      </Section>

      <Section title="Carrito">
        {cart.length === 0 ? (
          <Text className="text-sm font-semibold text-muted">
            Agrega platos para iniciar la venta.
          </Text>
        ) : null}
        {cart.map((item) => (
          <View
            key={item.dish.id}
            className="rounded-none bg-surface p-3 "
          >
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <Text className="font-semibold text-text ">
                  {item.dish.name}
                </Text>
                <Text className="text-sm font-bold text-muted">
                  {formatCurrency(item.dish.price * item.quantity)}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Pressable
                  accessibilityLabel={`Reducir cantidad de ${item.dish.name}`}
                  disabled={saving}
                  onPress={() => updateQuantity(item.dish.id, -1)}
                  className="rounded-none bg-surfaceElevated p-2"
                >
                  <MaterialIcons name="remove" size={18} color={c.text} />
                </Pressable>
                <Text className="w-6 text-center font-semibold text-text ">
                  {item.quantity}
                </Text>
                <Pressable
                  accessibilityLabel={`Aumentar cantidad de ${item.dish.name}`}
                  disabled={saving}
                  onPress={() => updateQuantity(item.dish.id, 1)}
                  className="rounded-none bg-surfaceElevated p-2"
                >
                  <MaterialIcons name="add" size={18} color={c.text} />
                </Pressable>
                <Pressable
                  accessibilityLabel={`Quitar ${item.dish.name} del carrito`}
                  disabled={saving}
                  onPress={() => removeItem(item.dish.id)}
                  className="rounded-none bg-errorContainer p-2"
                >
                  <MaterialIcons
                    name="delete-outline"
                    size={18}
                    color={c.error}
                  />
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </Section>

      <Section title="Pago">
        <View className="flex-row gap-2">
          {paymentMethods.map((item) => (
            <Choice
              key={item}
              label={item}
              selected={paymentMethod === item}
              onPress={() => setPaymentMethod(item)}
            />
          ))}
        </View>
        {paymentMethod === "Efectivo" ? (
          <Input
            value={formatCurrencyInput(amountReceived)}
            onChangeText={(value) =>
              setAmountReceived(value.replace(/\D/g, ""))
            }
            placeholder="Monto recibido"
            keyboardType="numeric"
          />
        ) : (
          <View className="gap-4">
            {transferQrUri ? (
              <View className="items-center gap-2">
                <View className="overflow-hidden rounded-none">
                  <Image
                    source={{ uri: transferQrUri }}
                    style={{ width: 400, height: 400 }}
                    contentFit="contain"
                  />
                </View>
              </View>
            ) : null}
              <View className="items-center gap-2">
                <Text className="text-sm font-bold text-muted">
                  Escanea el QR para transferir
                </Text>
              </View>
            <Input
              value={transferReference}
              onChangeText={setTransferReference}
              placeholder="Numero de referencia/transferencia"
            />
          </View>
        )}
      </Section>

      <View className="rounded-none bg-surface p-5 ">
        <TotalRow label="Subtotal" value={formatCurrency(subtotal)} />
        <TotalRow label="Domicilio" value={formatCurrency(deliveryFee)} />
        <TotalRow label="Total" value={formatCurrency(total)} strong />
        {paymentMethod === "Efectivo" ? (
          <TotalRow
            label="Cambio"
            value={formatCurrency(Math.max(changeAmount, 0))}
          />
        ) : null}
      </View>

      <Button title="Confirmar venta" loading={saving} onPress={confirmSale} />
    </ScreenScroll>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-3">
      <Text className="text-xl font-semibold text-text ">
        {title}
      </Text>
      {children}
    </View>
  );
}

function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      className={`rounded-none px-4 py-3 ${selected ? "bg-primary" : "bg-surface "}`}
    >
      <Text
        className={`text-sm font-semibold ${selected ? "text-onPrimary" : "text-text "}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Input(props: React.ComponentProps<typeof AppInput>) {
  return (
    <AutoField
      className="rounded-none bg-surface px-4 py-4 text-base font-semibold text-text "
      {...props}
    />
  );
}

function TotalRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text
        className={`${strong ? "text-lg" : "text-base"} font-bold text-muted`}
      >
        {label}
      </Text>
      <Text
        className={`${strong ? "text-2xl" : "text-base"} font-semibold text-text `}
      >
        {value}
      </Text>
    </View>
  );
}
