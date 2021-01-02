function mod(m, n) { // m is in one of the rest classes of Zn so mod: Z -> Zn: m -> r  surjective and not injective.
    let r = m % n;
    if (r == 0) {
        return 0;
    }
    if (r < 0) {
        return n + r;
    }
    return r;
}

module.exports= mod;