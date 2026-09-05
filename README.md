# FileDrop Next

Temporary file transfer: send a drop, share a code, receive files.

## Tech Stack

| Layer           | Stack                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| App             | [Next.js](https://nextjs.org) 16, [React](https://react.dev) 19, TypeScript                                   |
| UI              | [Tailwind CSS](https://tailwindcss.com) 4, [shadcn/ui](https://ui.shadcn.com), [Base UI](https://base-ui.com) |
| i18n / theme    | [next-intl](https://next-intl.dev), [next-themes](https://github.com/pacocoursey/next-themes)                 |
| Database        | [Drizzle ORM](https://orm.drizzle.team), PostgreSQL                                                           |
| Storage         | S3-compatible ([Cloudflare R2](https://developers.cloudflare.com/r2/), AWS S3)                                |
| Validation      | [Zod](https://zod.dev)                                                                                        |
| Package manager | [pnpm](https://pnpm.io) 11                                                                                    |

## Getting Started

Clone and install:

```bash
git clone git@github.com:zezsh/FileDrop-Next.git
cd FileDrop-Next
pnpm i
```

Create a `.env` with the [environment variables](#environment-variables) below, then migrate and start the dev server:

```bash
pnpm db:migrate
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](<https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fzezsh%2FFileDrop-Next&project-name=filedrop-next&repository-name=FileDrop-Next&env=DATABASE_URL%2CS3_ENDPOINT%2CS3_REGION%2CS3_ACCESS_KEY_ID%2CS3_SECRET_ACCESS_KEY%2CS3_BUCKET_NAME%2CPASSWORD_KDF&envDefaults=%7B%22S3_REGION%22%3A%22auto%22%2C%22PASSWORD_KDF%22%3A%22pbkdf2%22%7D&envDescription=Postgres%20connection%20string%20and%20S3-compatible%20storage%20credentials%20(Cloudflare%20R2%2C%20AWS%20S3%2C%20etc).&envLink=https%3A%2F%2Fgithub.com%2Fzezsh%2FFileDrop-Next%23environment-variables>)

Click the button to clone this repository and create a Vercel project. The deploy flow will prompt you for the environment variables below.

### Environment variables

| Variable               | Required | Default  | Description                                     |
| ---------------------- | -------- | -------- | ----------------------------------------------- |
| `DATABASE_URL`         | Yes      | —        | PostgreSQL connection string                    |
| `S3_ENDPOINT`          | Yes      | —        | S3-compatible API endpoint (e.g. Cloudflare R2) |
| `S3_ACCESS_KEY_ID`     | Yes      | —        | Object storage access key                       |
| `S3_SECRET_ACCESS_KEY` | Yes      | —        | Object storage secret key                       |
| `S3_BUCKET_NAME`       | Yes      | —        | Bucket name                                     |
| `S3_REGION`            | No       | `auto`   | Object storage region                           |
| `PASSWORD_KDF`         | No       | `pbkdf2` | Password KDF: `pbkdf2` or `argon2`              |
