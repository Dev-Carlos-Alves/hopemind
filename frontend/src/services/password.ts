/** Local checks for the password reset form (the API validates again). Returns the message or ''. */
export function resetFormError(code: string, password: string, confirm: string) {
  if (code.replace(/\D/g, '').length !== 6) return 'O código tem 6 dígitos.';
  if (password.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.';
  if (password !== confirm) return 'As senhas não são iguais.';
  return '';
}
