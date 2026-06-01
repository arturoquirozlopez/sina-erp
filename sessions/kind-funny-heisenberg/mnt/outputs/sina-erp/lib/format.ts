export const CLP  = (n: number | null | undefined) => '$' + Math.round(Number(n)||0).toLocaleString('es-CL');
export const NUM  = (n: number | null | undefined) => (Math.round((Number(n)||0)*100)/100).toLocaleString('es-CL');
export const PCT  = (n: number | null) => (n == null || isNaN(n) ? '—' : (n*100).toFixed(1) + '%');
export const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CL', { day:'2-digit', month:'2-digit', year:'numeric' });
};

export function rutDV(num: number) {
  let M=0, S=1;
  for (; num; num = Math.floor(num/10)) S = (S + (num%10)*(9-(M++%6))) % 11;
  return S ? String(S-1) : 'K';
}
export function validarRut(rut: string) {
  const clean = rut.replace(/[^0-9kK]/g,'').toUpperCase();
  if (clean.length < 2) return false;
  const body = clean.slice(0,-1); const dv = clean.slice(-1);
  return rutDV(parseInt(body,10)) === dv;
}
export function formatRut(rut: string) {
  const clean = rut.replace(/[^0-9kK]/g,'').toUpperCase();
  if (clean.length < 2) return rut;
  const body = clean.slice(0,-1).replace(/\B(?=(\d{3})+(?!\d))/g,'.');
  return `${body}-${clean.slice(-1)}`;
}
