'use client'

import Link from 'next/link'
import { Loader2, ShieldAlert, Clock } from 'lucide-react'
import { CardapioEditorPreview } from '@/components/template-editor/cardapio-editor-preview'
import { EditorHeader } from '@/components/template-editor/editor-header'
import { EditorInspector } from '@/components/template-editor/editor-inspector'
import { cn } from '@/lib/shared/utils'
import { getRestaurantScopedHref } from '@/lib/domains/core/active-restaurant'
import { useEditorState } from '@/lib/domains/core/editor/use-editor-state'
import { usePanelAccess } from '@/lib/domains/core/panel/panel-context'
import { useSubscriptionCheck } from '@/lib/domains/core/editor/use-subscription-check'
import { getMaxProducts } from '@/lib/domains/marketing/pricing'
import type { FormState } from '@/lib/domains/core/editor/types'

export default function EditorVisualPage() {
  const { capabilities } = usePanelAccess()
  const editor = useEditorState()
  const subscriptionCheck = useSubscriptionCheck(editor.restaurant?.id ?? null)

  const handleFormChange = (patch: Partial<FormState>) => {
    editor.setForm((prev) => ({ ...prev, ...patch }))
  }

  if (editor.loading || subscriptionCheck.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (subscriptionCheck.isBlocked) {
    const blockInfo = subscriptionCheck.blockInfo
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <Clock className="h-12 w-12 text-yellow-600" />
        <h2 className="text-xl font-bold">Seu cardápio está bloqueado</h2>
        <div className="max-w-md space-y-2 text-center">
          <p className="text-muted-foreground">
            {blockInfo?.reason ||
              'Sua assinatura expirou. Por favor, renove para continuar editando.'}
          </p>
          {blockInfo?.daysUntilBlock && blockInfo.daysUntilBlock > 0 && (
            <p className="text-sm font-medium text-yellow-700">
              Você tem {blockInfo.daysUntilBlock} dia(s) para resolver isso.
            </p>
          )}
        </div>
        <Link
          href={getRestaurantScopedHref('/painel')}
          className="text-primary mt-4 hover:underline"
        >
          Voltar ao painel
        </Link>
      </div>
    )
  }

  if (!capabilities.canAccessVisualEditor) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <ShieldAlert className="text-destructive h-10 w-10" />
        <p className="text-muted-foreground text-center">
          Acesso ao editor não disponível. Verifique se sua compra foi concluída.
        </p>
        <Link href="/templates" className="text-primary hover:underline">
          Ver templates disponíveis
        </Link>
      </div>
    )
  }

  if (!editor.restaurant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground">Delivery não encontrado.</p>
        <Link href={getRestaurantScopedHref('/painel')} className="text-primary hover:underline">
          Voltar ao painel
        </Link>
      </div>
    )
  }

  const maxProductsAllowed = getMaxProducts(editor.restaurant.plan_slug || 'basico')

  return (
    <div className="flex h-[calc(100vh-4rem)] min-w-0 flex-col overflow-hidden lg:h-screen">
      <EditorHeader
        panelHidden={editor.panelHidden}
        onTogglePanel={() => editor.setPanelHidden((p) => !p)}
        restaurantId={editor.restaurant?.id}
        cardapioUrl={editor.cardapioUrl}
        copied={editor.copied}
        onCopyAndPublish={editor.copyAndPublish}
      />

      <div className="border-b border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs text-blue-900 sm:px-6 sm:text-sm">
        Seu editor e o canal digital seguem preservados ao fazer upgrade. O plano apenas libera mais
        capacidade de cadastro, hoje em {maxProductsAllowed} produtos para esta unidade.
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        {!editor.panelHidden && (
          <EditorInspector
            form={editor.form}
            onFormChange={handleFormChange}
            displayCategories={editor.displayCategories}
            editingCategory={editor.editingCategory}
            onSetEditingCategory={editor.setEditingCategory}
            onEditCategory={editor.handleEditCategory}
            onCloneCategory={editor.handleCloneCategory}
            onDeleteCategory={editor.handleDeleteCategory}
            newCategoryName={editor.newCategoryName}
            onSetNewCategoryName={editor.setNewCategoryName}
            onAddCategory={editor.handleAddCategory}
            logoError={editor.logoError}
            bannerError={editor.bannerError}
            onLogoChange={editor.handleLogoChange}
            onBannerChange={editor.handleBannerChange}
          />
        )}

        <main className="bg-muted/30 flex min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-2 sm:p-4">
          {editor.previewRestaurant && (
            <div
              className={cn(
                'mx-auto w-full min-w-0 flex-1',
                editor.panelHidden ? 'max-w-2xl lg:max-w-4xl' : 'max-w-lg'
              )}
            >
              <CardapioEditorPreview
                restaurant={editor.previewRestaurant}
                products={editor.mergedProducts}
                selectedBlock={editor.selectedBlock}
                selectedField={editor.selectedField}
                selectedProductId={editor.selectedProductId}
                activeInlineTextField={editor.activeInlineTextField}
                activeInlineImageField={editor.activeInlineImageField}
                productDrafts={editor.productDrafts}
                inlineTextDrafts={editor.inlineTextDrafts}
                inlineImageDrafts={editor.inlineImageDrafts}
                productSaveState={editor.productSaveState}
                onSelectContext={editor.handleSelectContext}
                onInlineTextChange={editor.handleInlineTextChange}
                onInlineTextSave={editor.handleInlineTextSave}
                onInlineTextCancel={editor.handleInlineTextCancel}
                onInlineImageChange={editor.handleInlineImageChange}
                onInlineImageSave={editor.handleInlineImageSave}
                onInlineImageCancel={editor.handleInlineImageCancel}
                onInlineProductChange={editor.handleInlineProductChange}
                onInlineProductSave={editor.handleInlineProductSave}
                onInlineProductCancel={editor.handleInlineProductCancel}
                onAddProduct={editor.handleAddProduct}
                onDeleteProduct={editor.handleDeleteProduct}
                onCloneProduct={editor.handleCloneProduct}
                onRenameCategory={editor.handleEditCategory}
                onCloneCategory={editor.handleCloneCategory}
                onDeleteCategory={editor.handleDeleteCategory}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
