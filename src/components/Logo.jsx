import { useState } from "react";

/*
 * Shows your logo from  public/logo.png.
 * If that file does not exist yet, the "SH" letters are shown instead.
 */
function Logo() {

    const [missing, setMissing] = useState(false);

    if (missing) {
        return "SH";
    }

    return (
        <img
            src="/logo.png"
            alt="Siomai House"
            className="logo-img"
            onError={() => setMissing(true)}
        />
    );
}

export default Logo;
