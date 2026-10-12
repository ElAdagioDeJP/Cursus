import { signOut } from "@/auth/config";

export default function SignOutPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold">Cerrar sesión</h1>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button type="submit" className="rounded-md border px-4 py-2">
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}
