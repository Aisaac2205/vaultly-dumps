import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import type {
  Connection,
  CreateConnectionDto,
  UpdateConnectionDto,
  ConnectionTestResult,
  TestRawConnectionDto,
} from "../types";
import TestConnectionBadge from "./TestConnectionBadge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import PostgresSQL from "@/shared/assets/PostgresSQL.svg";
import MySQL from "@/shared/assets/MySQL.svg";

interface ConnectionFormProps {
  connection?: Connection;
  onSubmit: (
    dto: CreateConnectionDto | UpdateConnectionDto,
  ) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  testRaw?: (dto: TestRawConnectionDto) => Promise<ConnectionTestResult>;
}

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export default function ConnectionForm({
  connection,
  onSubmit,
  onCancel,
  isLoading,
  testRaw,
}: ConnectionFormProps) {
  const isEditMode = connection !== undefined;

  const [formData, setFormData] = useState({
    name: connection?.name ?? "",
    dbType: connection?.dbType ?? ("postgres" as "postgres" | "mysql"),
    environment: connection?.environment ?? "dev",
    host: connection?.host ?? "",
    port: connection?.port !== undefined ? String(connection.port) : "",
    database: connection?.database ?? "",
    username: connection?.username ?? "",
    password: "",
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationError(null);
  };

  const currentTestDto = (): TestRawConnectionDto => ({
    host: formData.host.trim(),
    port: Number(formData.port),
    database: formData.database.trim(),
    username: formData.username.trim(),
    password: formData.password || "",
    dbType: formData.dbType as "postgres" | "mysql",
  });

  const handleTestConnection = async () => {
    if (!testRaw) return;

    if (!formData.host.trim()) {
      setValidationError("Ingresá el host para probar la conexión");
      return;
    }
    if (!formData.port.trim() || isNaN(Number(formData.port))) {
      setValidationError("Ingresá un puerto válido para probar la conexión");
      return;
    }
    if (!formData.database.trim()) {
      setValidationError("Ingresá la base de datos para probar la conexión");
      return;
    }
    if (!formData.username.trim()) {
      setValidationError("Ingresá el usuario para probar la conexión");
      return;
    }
    if (!formData.password.trim()) {
      setValidationError("Ingresá la contraseña para probar la conexión");
      return;
    }

    setValidationError(null);
    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await testRaw(currentTestDto());
      setTestResult(result);
    } catch {
      setTestResult({ success: false, latencyMs: 0, error: "Error al ejecutar el test" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setValidationError("El nombre es obligatorio");
      return;
    }
    if (!formData.host.trim()) {
      setValidationError("El host es obligatorio");
      return;
    }
    if (!formData.port.trim() || isNaN(Number(formData.port))) {
      setValidationError("El puerto debe ser un número válido");
      return;
    }
    if (!formData.database.trim()) {
      setValidationError("La base de datos es obligatoria");
      return;
    }
    if (!formData.username.trim()) {
      setValidationError("El usuario es obligatorio");
      return;
    }
    if (!isEditMode && !formData.password.trim()) {
      setValidationError("La contraseña es obligatoria");
      return;
    }

    const dto: CreateConnectionDto | UpdateConnectionDto = {
      name: formData.name.trim(),
      dbType: formData.dbType as "postgres" | "mysql",
      environment: formData.environment,
      host: formData.host.trim(),
      port: Number(formData.port),
      database: formData.database.trim(),
      username: formData.username.trim(),
    };

    if (formData.password.trim()) {
      dto.password = formData.password;
    } else if (!isEditMode) {
      dto.password = "";
    }

    try {
      await onSubmit(dto);
    } catch {
      // Error handling is done by the parent
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditMode ? "Editar conexión" : "Nueva conexión"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Name */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="conn-name"
                className="text-xs font-semibold text-muted-foreground"
              >
                Nombre
              </label>
              <input
                id="conn-name"
                className={inputClass}
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Mi base de datos"
                disabled={isLoading}
              />
            </div>

            {/* DB Type */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Tipo de base de datos
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md border-2 px-3 py-2 text-sm font-semibold transition-all ${
                    formData.dbType === "postgres"
                      ? "border-success bg-muted"
                      : "border-border bg-background hover:border-muted-foreground/50"
                  } ${isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                  onClick={() => {
                    if (!isLoading) {
                      setFormData((prev) => ({ ...prev, dbType: "postgres" }));
                    }
                  }}
                  disabled={isLoading}
                >
                  <img
                    src={PostgresSQL}
                    alt="PostgreSQL"
                    className="h-6 w-6"
                  />
                  <span>PostgreSQL</span>
                </button>
                <button
                  type="button"
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md border-2 px-3 py-2 text-sm font-semibold transition-all ${
                    formData.dbType === "mysql"
                      ? "border-success bg-muted"
                      : "border-border bg-background hover:border-muted-foreground/50"
                  } ${isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                  onClick={() => {
                    if (!isLoading) {
                      setFormData((prev) => ({ ...prev, dbType: "mysql" }));
                    }
                  }}
                  disabled={isLoading}
                >
                  <img src={MySQL} alt="MySQL" className="h-6 w-6" />
                  <span>MySQL</span>
                </button>
              </div>
            </div>

            {/* Environment */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="conn-environment"
                className="text-xs font-semibold text-muted-foreground"
              >
                Ambiente
              </label>
              <select
                id="conn-environment"
                className={inputClass}
                name="environment"
                value={formData.environment}
                onChange={handleChange}
                disabled={isLoading}
              >
                <option value="dev">dev</option>
                <option value="sqa">sqa</option>
                <option value="prod">prod</option>
              </select>
            </div>

            {/* Host */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="conn-host"
                className="text-xs font-semibold text-muted-foreground"
              >
                Host
              </label>
              <input
                id="conn-host"
                className={inputClass}
                type="text"
                name="host"
                value={formData.host}
                onChange={handleChange}
                placeholder="localhost"
                disabled={isLoading}
              />
            </div>

            {/* Port */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="conn-port"
                className="text-xs font-semibold text-muted-foreground"
              >
                Puerto
              </label>
              <input
                id="conn-port"
                className={inputClass}
                type="number"
                name="port"
                value={formData.port}
                onChange={handleChange}
                placeholder="5432"
                disabled={isLoading}
              />
            </div>

            {/* Database */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="conn-database"
                className="text-xs font-semibold text-muted-foreground"
              >
                Nombre de la base de datos (Ej: mydb)
              </label>
              <input
                id="conn-database"
                className={inputClass}
                type="text"
                name="database"
                value={formData.database}
                onChange={handleChange}
                placeholder="mydb"
                disabled={isLoading}
              />
            </div>

            {/* Username */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="conn-username"
                className="text-xs font-semibold text-muted-foreground"
              >
                Usuario
              </label>
              <input
                id="conn-username"
                className={inputClass}
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="postgres"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="conn-password"
                className="text-xs font-semibold text-muted-foreground"
              >
                Contraseña
              </label>
              <input
                id="conn-password"
                className={inputClass}
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={
                  isEditMode
                    ? "Dejar vacío para mantener la actual"
                    : "••••••••"
                }
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Test result */}
          {testResult && (
            <div className="mt-4">
              <TestConnectionBadge result={testResult} isLoading={false} />
            </div>
          )}

          {/* Validation error */}
          {validationError && (
            <div className="mt-3 rounded-md bg-error-bg px-3 py-2 text-sm text-error">
              {validationError}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          {testRaw && (
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleTestConnection()}
              disabled={isLoading || isTesting}
            >
              {isTesting ? "Testeando..." : "Probar conexión"}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Guardando..."
              : isEditMode
                ? "Guardar cambios"
                : "Crear conexión"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
