import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserPlus } from "lucide-react";

import { generateRSAKeys } from "../crypto/rsa";

// =======================
// REUSABLE INPUT COMPONENT
// =======================
function Input({
    placeholder,
    type,
    value,
    onChange,
    show,
    setShow,
    name,
}) {
    return (
        <div style={styles.inputWrap}>
            <input
                style={styles.input}
                placeholder={placeholder}
                type={show ? "text" : type}
                value={value}
                onChange={onChange}
                autoComplete="new-password"
                name={name}
            />

            {type === "password" && (
                <span
                    style={styles.eye}
                    onClick={() => setShow(!show)}
                >
                    {show ? (
                        <EyeOff size={18} />
                    ) : (
                        <Eye size={18} />
                    )}
                </span>
            )}
        </div>
    );
}

// =======================
// REGISTER PAGE
// =======================
export default function Register() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: "",
        display_name: "",
        password: "",
        confirm_password: "",
    });

    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        setError("");

        if (
            !form.username ||
            !form.display_name ||
            !form.password ||
            !form.confirm_password
        ) {
            return setError("All fields are required");
        }

        if (form.password.length < 8) {
            return setError("Password must be at least 8 characters");
        }

        if (form.password !== form.confirm_password) {
            return setError("Passwords do not match");
        }

        try {
            setLoading(true);

            // generate rsa keys
            const { publicKey, privateKey } =
                await generateRSAKeys();

            // generate salt
            const salt =
                crypto.getRandomValues(new Uint8Array(16));

            const saltBase64 = btoa(
                String.fromCharCode(...salt)
            );

            // register request
            const res = await fetch(
                "https://whisperbox.koyeb.app/auth/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({
                        username: form.username,
                        display_name: form.display_name,
                        password: form.password,
                        public_key: publicKey,
                        wrapped_private_key: privateKey,
                        pbkdf2_salt: saltBase64,
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                return setError(
                    data.detail || "Registration failed"
                );
            }

            // save auth
            localStorage.setItem(
                "token",
                data.access_token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            localStorage.setItem(
                "keys",
                JSON.stringify({
                    publicKey: data.user.public_key,
                    privateKey:
                        data.user.wrapped_private_key,
                    salt: data.user.pbkdf2_salt,
                })
            );

            navigate("/chat");
        } catch (err) {
            console.error(err);
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>

                {/* HEADER */}
                <div style={styles.header}>
                    <UserPlus size={20} />

                    <div>
                        <h2>Create account</h2>

                        <p style={styles.sub}>
                            End-to-End Encrypted messaging
                        </p>
                    </div>
                </div>

                <p style={styles.note}>
                    A unique RSA keypair will be generated
                    for you.
                </p>

                {error && (
                    <div style={styles.error}>
                        {error}
                    </div>
                )}

                {/* USERNAME */}
                <input
                    style={styles.input}
                    placeholder="Username"
                    value={form.username}
                    onChange={(e) =>
                        setForm({
                            ...form,
                            username: e.target.value,
                        })
                    }
                />

                {/* DISPLAY NAME */}
                <input
                    style={styles.input}
                    placeholder="Display name"
                    value={form.display_name}
                    onChange={(e) =>
                        setForm({
                            ...form,
                            display_name:
                                e.target.value,
                        })
                    }
                />

                {/* PASSWORD */}
                <Input
                    placeholder="Password"
                    type="password"
                    name="register-password"
                    value={form.password}
                    onChange={(e) =>
                        setForm({
                            ...form,
                            password: e.target.value,
                        })
                    }
                    show={showPass}
                    setShow={setShowPass}
                />

                {/* CONFIRM PASSWORD */}
                <Input
                    placeholder="Confirm password"
                    type="password"
                    name="confirm-register-password"
                    value={form.confirm_password}
                    onChange={(e) =>
                        setForm({
                            ...form,
                            confirm_password:
                                e.target.value,
                        })
                    }
                    show={showConfirm}
                    setShow={setShowConfirm}
                />

                {/* BUTTON */}
                <button
                    onClick={submit}
                    style={styles.button}
                    disabled={loading}
                >
                    {loading
                        ? "Creating account..."
                        : "Create account"}
                </button>

                {/* FOOTER */}
                <p style={styles.footer}>
                    Already have an account?{" "}
                    <span
                        onClick={() => navigate("/")}
                        style={styles.link}
                    >
                        Sign in
                    </span>
                </p>

            </div>
        </div>
    );
}

// =======================
// STYLES
// =======================
const styles = {
    page: {
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#0b1220",
    },

    card: {
        width: 380,
        padding: 24,
        borderRadius: 12,
        background: "#111827",
        color: "#fff",
    },

    header: {
        display: "flex",
        gap: 10,
        marginBottom: 10,
        alignItems: "center",
    },

    sub: {
        fontSize: 12,
        opacity: 0.7,
    },

    note: {
        fontSize: 12,
        opacity: 0.6,
        marginBottom: 12,
    },

    inputWrap: {
        position: "relative",
    },

    input: {
        width: "100%",
        padding: 12,
        marginBottom: 12,
        borderRadius: 8,
        background: "#0b1220",
        color: "#fff",
        border: "1px solid #334155",
        outline: "none",
        boxSizing: "border-box",
    },

    eye: {
        position: "absolute",
        right: 10,
        top: 12,
        cursor: "pointer",
        color: "#aaa",
    },

    button: {
        width: "100%",
        padding: 12,
        background: "#22c55e",
        border: "none",
        borderRadius: 8,
        fontWeight: "bold",
        color: "#000",
        cursor: "pointer",
    },

    error: {
        background: "#ef4444",
        padding: 8,
        borderRadius: 6,
        marginBottom: 10,
        fontSize: 12,
    },

    footer: {
        marginTop: 10,
        fontSize: 12,
        textAlign: "center",
        opacity: 0.7,
    },

    link: {
        color: "#22c55e",
        cursor: "pointer",
    },
};