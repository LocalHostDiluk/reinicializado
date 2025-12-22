import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";

export const TestPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTest = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert(`Email: ${email}\nPassword: ${password}`);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">
            🧪 Prueba de Componentes UI
          </h1>
          <p className="text-neutral-600">Sistema de Gestión para Carnicería</p>
        </div>

        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Botones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
            <div className="flex gap-4 mt-4">
              <Button isLoading>Loading Button</Button>
              <Button disabled>Disabled</Button>
            </div>
          </CardContent>
        </Card>

        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-w-md">
              <Input
                label="Email"
                type="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                helperText="Mínimo 6 caracteres"
              />
              <Input
                label="Input con error"
                type="text"
                error="Este campo es requerido"
              />
              <Input
                label="Input deshabilitado"
                type="text"
                defaultValue="No se puede editar"
                disabled
              />
            </div>
          </CardContent>
        </Card>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card hover>
            <CardHeader>
              <CardTitle>Card 1</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600">
                Esta es una card con efecto hover
              </p>
            </CardContent>
          </Card>

          <Card hover className="bg-secondary text-white">
            <CardHeader>
              <CardTitle className="text-white">Card 2</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/90">Card con fondo personalizado</p>
            </CardContent>
          </Card>

          <Card hover>
            <CardHeader>
              <CardTitle>Card 3</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Ventas hoy</span>
                  <span className="font-semibold">$15,420</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Productos</span>
                  <span className="font-semibold">45</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Example */}
        <Card>
          <CardHeader>
            <CardTitle>Formulario de Prueba</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={handleTest}
                  isLoading={isLoading}
                  className="flex-1"
                >
                  Probar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEmail("");
                    setPassword("");
                  }}
                >
                  Limpiar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
