"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import ProductForm, { createEmptyProduct } from "@/components/admin/ProductForm";
import { usePreferences } from "@/lib/preferences";
import { adminText } from "@/lib/admin-i18n";
import { useStore } from "@/lib/store";

export default function NewProductPage() {
  const router = useRouter();
  const createProduct = useStore((state) => state.createProduct);
  const locale = usePreferences((s) => s.locale);
  const t = adminText[locale].inventoryEdit;
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">{t.newTitle}</h1>
            <p className="mt-1 text-muted-foreground">{t.newSubtitle}</p>
          </div>
          <Link href="/admin/inventory" className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted">
            {t.back}
          </Link>
        </div>

        <ProductForm
          initialProduct={createEmptyProduct()}
          submitLabel={t.create}
          isSubmitting={isSubmitting}
          onSubmit={async (product) => {
            setIsSubmitting(true);
            const created = await createProduct(product);
            setIsSubmitting(false);
            if (created) router.push(`/admin/inventory/${created.id}`);
          }}
        />
      </div>
    </AdminLayout>
  );
}
