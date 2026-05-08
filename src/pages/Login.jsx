import { useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [show, setShow] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async () => {
        setError("");

        if (!email || !password) {
            return setError("Email and password are required");
        }

        try {
            const res = await fetch(
                "https://whisperbox.koyeb.app/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email, // ✅ FIXED (was username)
                        password,
                    }),
                }
            );

            const data = await res.json();

            console.log("LOGIN RESPONSE:", data);

            if (!res.ok) {
                return setError(
                    data.detail ||
                    data.message ||
                    "Login failed"
                );
            }

            // save token
            localStorage.setItem("token", data.access_token);

            // save user
            localStorage.setItem("user", JSON.stringify(data.user));

            // save keys
            localStorage.setItem(
                "keys",
                JSON.stringify({
                    publicKey: data.user.public_key,
                    privateKey: data.user.wrapped_private_key,
                    salt: data.user.pbkdf2_salt,
                })
            );

            // redirect
            window.location.href = "/chat";

        } catch (err) {
            console.error(err);
            setError("Network error");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">

            <div className="w-full max-w-md bg-white p-6 rounded-xl shadow">

                {/* HEADER */}
                <div className="flex items-center gap-2 mb-4">
                    <Lock />
                    <h1 className="font-bold text-xl">WhisperBox</h1>
                </div>

                <p className="text-sm text-gray-500 mb-4">
                    End-to-End Encrypted messaging
                </p>

                <div className="flex items-center gap-2 bg-green-50 text-green-600 p-2 rounded mb-4 text-sm">
                    <ShieldCheck size={16} />
                    Your messages are encrypted before reaching servers
                </div>

                {/* ERROR */}
                {error && (
                    <div className="bg-red-100 text-red-600 p-2 rounded mb-3 text-sm">
                        {error}
                    </div>
                )}

                {/* EMAIL */}
                <input
                    className="w-full p-2 border rounded mb-3"
                    placeholder="Email"
                    value={email}
                    autoComplete="off"
                    onChange={(e) => setEmail(e.target.value)}
                />

                {/* PASSWORD */}
                <div className="relative mb-3">
                    <input
                        className="w-full p-2 border rounded pr-10"
                        type={show ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        autoComplete="new-password"
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <button
                        type="button"
                        className="absolute right-2 top-2 text-gray-500"
                        onClick={() => setShow(!show)}
                    >
                        {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                {/* BUTTON */}
                <button
                    onClick={handleLogin}
                    className="w-full bg-green-500 text-white p-2 rounded"
                >
                    Sign in
                </button>

                {/* LINK */}
                <p className="text-center text-sm mt-3">
                    New here?{" "}
                    <Link className="text-green-600" to="/register">
                        Create account
                    </Link>
                </p>

            </div>
        </div>
    );
}