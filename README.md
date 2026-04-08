# Circle Personal Fork

Este repositorio es un fork de Circle, una interfaz de gestion de proyectos inspirada en Linear.

Esta version esta siendo adaptada para uso personal. El objetivo no es reconstruir Linear completo, sino convertir la base visual original en una herramienta simple y usable para gestionar proyectos, issues y etiquetas.

## Enfoque de esta version

Se recorto el producto para priorizar un flujo personal:

- proyectos
- issues
- etiquetas
- persistencia real con PostgreSQL

Y se dejaron fuera, o en segundo plano, las funciones orientadas a trabajo en equipo que no aportan al caso de uso personal.

## Desarrollo local

Este proyecto espera una instancia compartida de PostgreSQL corriendo fuera del repo.

Comandos principales:

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Estado actual

Este fork esta en transicion desde una UI demo basada en mocks hacia una app personal con datos reales.

La prioridad actual es mantener la calidad visual original de Circle mientras se reemplazan gradualmente los datos mock por persistencia real.

## Credito

Basado en Circle, proyecto original de UI inspirado en Linear.
