# Configuración del entorno de desarrollo local

> **ADVERTENCIA**
>
> Esta es una configuración exclusivamente para desarrollo local.
>
> NO INTENTE EJECUTARLA EN UN SERVIDOR PÚBLICAMENTE ACCESIBLE

## Instalar Docker

La configuración sugerida para desarrollo utiliza Docker para ejecutar dos dependencias: `postgres` y `redis`, además de configurar un contenedor ejecutando `pgadmin4` en caso de que necesites interactuar directamente con la base de datos (se recomienda evitar esto siempre que sea posible).

Puedes instalar Docker usando el [sitio oficial de descarga e instrucciones](https://docs.docker.com/engine/install/).

### Acceder a Docker como usuario en Linux

Si estás usando Linux, es recomendable añadir tu usuario al grupo docker, así podrás emitir comandos sin necesidad de usar root:

```bash
adduser username docker
```

Puede ser necesario cerrar y volver a iniciar sesión antes de continuar. Solo cerrar la ventana de la terminal no será suficiente — es necesario realizar un cierre de sesión completo en el entorno gráfico.

## Instalar NodeJS

Para desarrollar en Ticketz, necesitas tener NodeJS 20 instalado. Si aún no lo tienes, puedes obtenerlo en el [sitio oficial de NodeJS](https://nodejs.org/en/download/prebuilt-binaries).

Después de la instalación, verifica que Node y npm estén disponibles ejecutando los siguientes comandos en una terminal:

```bash
node -v

npm -v
```

## Descargar el repositorio

Necesitas clonar este repositorio en tu computadora antes de realizar cualquier otro paso:

```bash
git clone https://github.com/ticketz-oss/ticketz
```

Cualquier comando siguiente deberá ser ejecutado dentro del directorio clonado, a menos que se especifique lo contrario:

```bash
cd ticketz
```

## Ejecutar postgres y redis con Docker

Ticketz proporciona una configuración de docker-compose para ejecutar `postgres` y `redis`. Inícialo con:

```bash
docker compose -f docker-compose-dev.yaml up -d
```

Después de unos segundos, tendrás:

- Postgres ejecutándose en el puerto 5432 del localhost. Creará automáticamente un usuario y una base de datos, ambos con el nombre `ticketz`. El usuario `ticketz` aceptará cualquier contraseña.
- Redis ejecutándose en el puerto 6379 del localhost.
- PgAdmin4 ejecutándose en https://localhost:8081 — El nombre de usuario es `admin@ticketz.host` y la contraseña es `123456`. Ya habrá una conexión de servidor configurada. Cuando se solicite la contraseña del usuario `ticketz`, puedes insertar cualquier cosa.

## Backend

Los comandos siguientes deben ser emitidos en la carpeta `backend`. Asegúrate de entrar en ella antes de continuar.

### Instalar dependencias

El siguiente comando instalará las dependencias del backend:

```bash
npm ci
```

### Archivo de configuración

El ejemplo de configuración predeterminado debe ser copiado al archivo de configuración. Ya tiene un buen conjunto de parámetros predeterminados.

**En Linux:**

```bash
cp .env.dev .env
```

**En Windows:**

```powershell
copy .env.dev .env
```

### Inicializar la base de datos

La base de datos creada estará vacía. Para inicializarla, ejecuta los siguientes comandos:

```bash
npm run build

npx sequelize db:migrate

npx sequelize db:seed:all
```

### Ejecutar el backend

Puedes abrir una nueva terminal, navegar hasta la carpeta `backend` y ejecutar este comando:

```bash
npm run dev:server
```

Déjalo ejecutando. Monitorizará cambios en los archivos y se reiniciará automáticamente. También se conectará al depurador si se inicia desde un entorno configurado en VSCode.

## Frontend

Entra en la carpeta `frontend` antes de los siguientes pasos.

### Instalar dependencias

El siguiente comando instalará las dependencias del frontend:

```bash
npm ci
```

### Ejecutar el frontend

```bash
npm run start
```

Después de unos minutos, la ventana del frontend se abrirá en http://localhost:3000.

Deja el comando ejecutando. Monitorizará cambios en los archivos y recargará según sea necesario.

## Mantenimiento

### Servicios de Docker

Puedes detener, limpiar los datos y reiniciar los servicios Docker de `postgres`, `redis` y `pgadmin`.

Todos los comandos deben ser ejecutados dentro de la carpeta base del proyecto (generalmente `ticketz`).

#### Detener los servicios

```bash
docker compose -f docker-compose-dev.yaml down
```

#### Eliminar los datos (resetear)

Los nombres de los volúmenes pueden ser diferentes si has clonado la carpeta con un nombre diferente de `ticketz`.

```bash
docker volume rm ticketz_postgres_data
docker volume rm ticketz_redis_data
```

#### (Re)iniciar los servicios

```bash
docker compose -f docker-compose-dev.yaml up -d
```

### Cambiar configuraciones

Por defecto, estos son los puertos utilizados en esta guía:

- Postgres: 5432
- Redis: 6379
- PgAdmin: 8081
- Backend de Ticketz: 8080
- Frontend de Ticketz: 3000

Puedes cambiar los puertos de `postgres`, `redis` y `pgadmin` editando el archivo `docker-compose-dev.yaml`.

Para cambiar el puerto del backend de Ticketz, edita el archivo `.env` y también crea el archivo `config-dev.json` en `frontend/public`, usando como base el `frontend/public/config-dev-example.json`.

Para cambiar el puerto del frontend de Ticketz, crea un archivo `.env` en la carpeta `frontend` configurando el puerto deseado:

```bash
PORT=3001
```
