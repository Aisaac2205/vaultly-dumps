import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { useTranslation } from "react-i18next";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import { useManualRetentionSettings } from "../hooks/useManualRetention";

const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

interface NumberFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min: number;
  placeholder: string;
  disabled: boolean;
  hint: string;
}

function NumberField({
  id,
  label,
  value,
  onChange,
  min,
  placeholder,
  disabled,
  hint,
}: NumberFieldProps) {
  const hintId = `${id}-hint`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        className={inputClass}
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-describedby={hintId}
      />
      <p id={hintId} className="text-[11px] text-muted-foreground">
        {hint}
      </p>
    </div>
  );
}

export function ManualRetentionSettings() {
  const { t } = useTranslation('cleanup')
  const {
    data,
    isLoading,
    isError,
    error,
    enabled,
    setEnabled,
    keepLast,
    setKeepLast,
    maxAgeDays,
    setMaxAgeDays,
    maxSizeMb,
    setMaxSizeMb,
    handleSave,
    isSaving,
  } = useManualRetentionSettings();

  return (
    <Card>
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            {t('manual.title')}
          </h3>
          <p className="max-w-2xl text-xs text-muted-foreground">
            {t('manual.description')}
          </p>
        </div>

        {enabled && (
          <div
            role="status"
            className="rounded-md border border-accent/25 bg-accent/5 px-3 py-2 text-xs text-accent-foreground"
          >
            {t('manual.activeNotice')}
          </div>
        )}

        {isError && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {t('error.loadRetention', { message: error instanceof Error ? error.message : t('error.generic', { ns: 'common' }) })}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            id="mr-enabled"
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            disabled={isLoading}
          />
          <label htmlFor="mr-enabled" className="text-sm">
            {t('manual.enable')}
          </label>
        </div>

        {enabled && (
          <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <legend className="sr-only">{t('manual.title')}</legend>
            <NumberField
              id="mr-keep-last"
              label={t('manual.keepLast')}
              value={keepLast}
              onChange={setKeepLast}
              min={0}
              placeholder="10"
              disabled={isLoading}
              hint={t('manual.keepLastHint')}
            />
            <NumberField
              id="mr-max-age"
              label={t('manual.maxAge')}
              value={maxAgeDays}
              onChange={setMaxAgeDays}
              min={1}
              placeholder="30"
              disabled={isLoading}
              hint={t('manual.maxAgeHint')}
            />
            <NumberField
              id="mr-max-size"
              label={t('manual.maxSize')}
              value={maxSizeMb}
              onChange={setMaxSizeMb}
              min={1}
              placeholder="2000"
              disabled={isLoading}
              hint={t('manual.maxSizeHint')}
            />
          </fieldset>
        )}

        {data && (
          <div
            aria-live="polite"
            className="space-y-1 border-t pt-4 text-[11px] text-muted-foreground"
          >
            {data.updatedAt && (
              <p>
                {t('manual.lastEdited')}{" "}
                <span title={formatDateTime(data.updatedAt)}>
                  {formatRelativeTime(data.updatedAt)}
                </span>
              </p>
            )}
            <p>
              {t('manual.lastSweep')}{" "}
              {data.lastSweepAt ? (
                <span title={formatDateTime(data.lastSweepAt)}>
                  {formatRelativeTime(data.lastSweepAt)}
                </span>
              ) : (
                t('manual.neverSwept')
              )}
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading || isSaving}
          >
            {isSaving ? t('action.saving', { ns: 'common' }) : t('action.save', { ns: 'common' })}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
