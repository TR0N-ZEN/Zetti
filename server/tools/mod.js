
/**
 * 
 * @param {number} m is in one of the rest classes of Z_n so mod: Z -> Z_n: m -> r  surjective and not injective.
 * @param {number} n 
 * @returns modul of m in Z_n 
 */
function mod(m, n)
{
  return (m % n) +
         (m < 0) * n;
}

module.exports.mod = mod;