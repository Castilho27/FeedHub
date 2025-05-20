import { Suspense } from "react";
import ProfileContent  from "../../components/ProfileContent";

export default function Page() {
  return (
    <main className="flex justify-center items-center min-h-screen">
      <Suspense fallback={<p>Carregando perfil...</p>}>
        <ProfileContent />
      </Suspense>
    </main>
  );
}
