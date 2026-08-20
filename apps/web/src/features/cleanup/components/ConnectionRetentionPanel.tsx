import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { useConnectionRetentionPanel } from "../hooks/useConnectionRetention";

const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function ConnectionRetentionPanel() {
  const { t } = useTranslation("cleanup");
  const {
    connections,
    connectionSlug,
    setConnectionSlug,
    confirmOpen,
    setConfirmOpen,
    validationError,
    rows,
    updateRow,
    handleSave,
    handleRunCleanup,
    connectionSelected,
    isLoading,
    policiesError,
    policiesErrorObj,
    isDirty,
    hasSavedPolicy,
    prunable,
    totalCount,
    totalMb,
    previewLoading,
    isSaving,
    isRunning,
  } = useConnectionRetentionPanel();

  const prodConnections = connections.filter((c) => c.environment === "prod");

  return (
    <Card variant="outlined" className="overflow-hidden">
      <CardHeader className="border-b border-border bg-card px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-text-primary">
              {t("retention.title")}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {t("retention.description")}
            </CardDescription>
          </div>
          <div className="w-full sm:w-64">
            <select
              id="retention-connection"
              value={connectionSlug}
              onChange={(e) => setConnectionSlug(e.target.value)}
              disabled={isLoading}
              className={inputClass}
            >
              <option value="">{t("retention.selectConnection")}</option>
              {prodConnections.map((connection) => (
                <option key={connection.id} value={connection.slug}>
                  {connection.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!isLoading && !isDirty && hasSavedPolicy && connectionSelected && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            {t("retention.policyApplied")}
          </div>
        )}
      </CardHeader>

      {!connectionSelected ? (
        <CardContent className="p-8 text-center text-xs text-muted-foreground">
          {prodConnections.length === 0
            ? t("retention.noProdConnections")
            : t("form.hint.noConnection")}
        </CardContent>
      ) : (
        <>
          {policiesError && (
            <div className="p-5 pb-0">
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {policiesErrorObj instanceof Error
                  ? policiesErrorObj.message
                  : t("retention.errorLoad")}
              </div>
            </div>
          )}

          <CardContent className="space-y-5 p-5">
            <div className="grid gap-3">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-12 animate-pulse rounded-md bg-muted"
                    />
                  ))}
                </div>
              ) : (
                rows.map((row) => {
                  const valueId = `retention-days-${row.category}`;
                  const keepId = `retention-keep-${row.category}`;
                  return (
                    <fieldset
                      key={row.category}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3"
                    >
                      <legend className="sr-only">
                        {t(`category.${row.category}`)}
                      </legend>
                      <span className="w-32 text-xs font-semibold text-text-primary">
                        {t(`category.${row.category}`)}
                      </span>

                      <div className="flex items-center gap-4">
                        <label
                          htmlFor={keepId}
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                          <input
                            id={keepId}
                            type="checkbox"
                            checked={row.keepForever}
                            onChange={(e) =>
                              updateRow(row.category, {
                                keepForever: e.target.checked,
                              })
                            }
                            disabled={isSaving}
                            className="rounded border-input text-primary focus:ring-1 focus:ring-ring"
                          />
                          {t("retention.keepForever")}
                        </label>

                        {!row.keepForever && (
                          <div className="flex items-center gap-2">
                            <label htmlFor={valueId} className="sr-only">
                              {t("retention.daysLabel", {
                                category: t(`category.${row.category}`),
                              })}
                            </label>
                            <input
                              id={valueId}
                              className={`${inputClass} w-20 text-center text-xs`}
                              type="number"
                              min={1}
                              step={1}
                              value={row.days}
                              onChange={(e) =>
                                updateRow(row.category, {
                                  days: e.target.value,
                                })
                              }
                              disabled={isSaving}
                            />
                            <span className="text-xs text-muted-foreground">
                              {t("retention.days")}
                            </span>
                          </div>
                        )}
                      </div>
                    </fieldset>
                  );
                })
              )}
            </div>

            {validationError && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {validationError}
              </div>
            )}

            {/* Impact preview */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="text-xs font-semibold text-text-primary">
                {t("retention.impact.title")}
              </h4>
              <p className="text-xs text-muted-foreground">
                {t("retention.impact.description")}
              </p>

              <div className="mt-3">
                {previewLoading ? (
                  <p className="text-xs text-muted-foreground">
                    {t("retention.impact.calculating")}
                  </p>
                ) : prunable.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {t("retention.impact.empty")}
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="grid gap-2 sm:grid-cols-3">
                      {prunable.map((item) => (
                        <div
                          key={item.category}
                          className="rounded-md border border-border/80 bg-muted/30 p-2.5"
                        >
                          <p className="text-[11px] font-medium text-muted-foreground">
                            {t(`category.${item.category}`)}
                          </p>
                          <p className="text-sm font-semibold text-text-primary">
                            {item.count}{" "}
                            <span className="text-xs font-normal text-muted-foreground">
                              {item.count === 1 ? "respaldo" : "respaldos"}
                            </span>
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {item.totalSizeMb.toFixed(2)} MB
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="pt-1 text-xs font-medium text-text-primary">
                      {t("retention.impact.total", {
                        count: totalCount,
                        mb: totalMb.toFixed(2),
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3 border-t border-border bg-muted/20 px-5 py-3.5">
            <Button
              type="button"
              variant="destructive"
              disabled={prunable.length === 0 || isRunning}
              onClick={() => setConfirmOpen(true)}
            >
              {isRunning && (
                <Loader2 className="animate-spin" aria-hidden="true" />
              )}
              {t("retention.runNow")}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isLoading || isSaving || !isDirty}
            >
              {isSaving ? t("retention.saving") : t("retention.savePolicy")}
            </Button>
          </CardFooter>
        </>
      )}

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle
                className="size-5 text-destructive"
                aria-hidden="true"
              />
              {t("retention.confirm.title")}
            </DialogTitle>
            <DialogDescription>
              {t("retention.confirm.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isRunning}
            >
              {t("retention.confirm.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleRunCleanup()}
              disabled={isRunning}
            >
              {isRunning && (
                <Loader2 className="animate-spin" aria-hidden="true" />
              )}
              {t("retention.confirm.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
