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

  return (
    <div className="space-y-4">
      {/* Connection selector */}
      <Card>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="space-y-1.5">
            <label
              htmlFor="retention-connection"
              className="block text-xs font-medium text-muted-foreground"
            >
              {t("retention.database")}
            </label>
            <select
              id="retention-connection"
              value={connectionSlug}
              onChange={(e) => setConnectionSlug(e.target.value)}
              disabled={isLoading}
              className={inputClass}
            >
              <option value="">{t("retention.selectConnection")}</option>
              {connections
                .filter((c) => c.environment === "prod")
                .map((connection) => (
                  <option key={connection.id} value={connection.slug}>
                     {connection.name}
                  </option>
                ))}
            </select>
            {!isLoading &&
              connections.filter((c) => c.environment === "prod").length ===
                0 && (
                <p className="text-xs text-muted-foreground">
                  {t("retention.noProdConnections")}
                </p>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Policy form */}
      {connectionSelected && (
        <Card>
          <CardHeader>
            <CardTitle>{t("retention.title")}</CardTitle>
            <CardDescription>
              {t("retention.description")}
            </CardDescription>
            {!isLoading && !isDirty && hasSavedPolicy && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600">
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                {t("retention.policyApplied")}
              </div>
            )}
          </CardHeader>

          {policiesError && (
            <CardContent>
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {policiesErrorObj instanceof Error
                  ? policiesErrorObj.message
                  : t("retention.errorLoad")}
              </div>
            </CardContent>
          )}

          <CardContent className="flex flex-col gap-4">
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
                    className="flex flex-wrap items-center gap-3 rounded-md border border-border px-4 py-3"
                  >
                    <legend className="sr-only">
                      {t(`category.${row.category}`)}
                    </legend>
                    <span className="w-32 text-sm font-medium">
                      {t(`category.${row.category}`)}
                    </span>

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
                      />
                      {t("retention.keepForever")}
                    </label>

                    {!row.keepForever && (
                      <div className="flex items-center gap-2">
                        <label htmlFor={valueId} className="sr-only">
                          {t("retention.daysLabel", { category: t(`category.${row.category}`) })}
                        </label>
                        <input
                          id={valueId}
                          className={`${inputClass} w-20`}
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
                        <span className="text-sm text-muted-foreground">
                          {t("retention.days")}
                        </span>
                      </div>
                    )}
                  </fieldset>
                );
              })
            )}

            {validationError && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {validationError}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-end gap-3">
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
        </Card>
      )}

      {/* Impact preview */}
      {connectionSelected && (
        <Card>
          <CardHeader>
            <CardTitle>{t("retention.impact.title")}</CardTitle>
            <CardDescription>
              {t("retention.impact.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {previewLoading ? (
              <p className="text-sm text-muted-foreground">
                {t("retention.impact.calculating")}
              </p>
            ) : prunable.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("retention.impact.empty")}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {prunable.map((item) => (
                    <div
                      key={item.category}
                      className="rounded-md border border-border px-4 py-3"
                    >
                      <p className="text-xs font-medium text-muted-foreground">
                        {t(`category.${item.category}`)}
                      </p>
                      <p className="text-lg font-semibold">
                        {item.count}{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          {item.count === 1 ? "dump" : "dumps"}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.totalSizeMb.toFixed(2)} MB
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("retention.impact.total", { count: totalCount, mb: totalMb.toFixed(2) })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
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
    </div>
  );
}
