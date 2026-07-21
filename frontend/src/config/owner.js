// Único usuário autorizado a ações destrutivas (ex.: excluir clínica).
// O backend também valida — isto controla apenas a visibilidade na UI.
export const OWNER_EMAIL = "enzo.silva@codebit.com.br";

export function isOwner(user) {
  return user?.email?.toLowerCase() === OWNER_EMAIL;
}
