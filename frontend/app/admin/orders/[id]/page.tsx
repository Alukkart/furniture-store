"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import OrderForm from "@/components/admin/OrderForm";
import { useStore } from "@/lib/store";

export default function EditOrderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const bootstrap = useStore((state) => state.bootstrap);
  const products = useStore((state) => state.products);
  const orders = useStore((state) => state.orders);
  const isBootstrapping = useStore((state) => state.isBootstrapping);
  const updateOrder = useStore((state) => state.updateOrder);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const order = useMemo(
    () => orders.find((entry) => entry.id === params.id),
    [orders, params.id]
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">Edit Order</h1>
            <p className="mt-1 text-muted-foreground">Adjust customer info, item mix, delivery address, and status.</p>
          </div>
          <Link href="/admin/orders" className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted">
            Back to orders
          </Link>
        </div>

        {!order ? (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            {isBootstrapping ? "Loading order..." : "Order not found."}
          </div>
        ) : (
          <OrderForm
            initialOrder={order}
            products={products}
            submitLabel="Save order"
            isSubmitting={isSubmitting}
            onSubmit={async (nextOrder) => {
              setIsSubmitting(true);
              const updated = await updateOrder(nextOrder);
              setIsSubmitting(false);
              if (updated) {
                router.push("/admin/orders");
              }
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}
