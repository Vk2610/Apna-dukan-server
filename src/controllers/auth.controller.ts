import { Request, Response } from "express";
import { z } from "zod";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  verifyEmailToken,
  resendVerificationEmail,
} from "../services/auth.services.js";

// Registration validation
const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});

// Login validation
const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

// Refresh token validation
const refreshSchema = z.object({
  refreshToken: z.string().trim().min(1),
});

// REGISTER CONTROLLER
export const register = async (req: Request, res: Response) => {
  const validation = registerSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid registration details.",
      errors: validation.error.flatten().fieldErrors,
    });
  }

  try {
    const { user, emailSent } = await registerUser(validation.data);

    return res.status(201).json({
      success: true,
      message: emailSent
        ? "Account created successfully. Please check your email to verify your account."
        : "Account created, but we could not send the verification email. Please request a new verification email.",
      data: user,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "EMAIL_ALREADY_EXISTS"
    ) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong during registration.",
    });
  }
};

// LOGIN CONTROLLER
export const login = async (req: Request, res: Response) => {
  const validation = loginSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid login details.",
      errors: validation.error.flatten().fieldErrors,
    });
  }

  try {
    const result = await loginUser(validation.data);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: result,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVALID_CREDENTIALS"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong during login.",
    });
  }
};

// REFRESH TOKEN CONTROLLER
export const refresh = async (req: Request, res: Response) => {
  const validation = refreshSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Refresh token is required.",
    });
  }

  try {
    const result = await refreshAccessToken(
      validation.data.refreshToken
    );

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully.",
      data: result,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVALID_REFRESH_TOKEN"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token.",
      });
    }

    console.error("Token refresh error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while refreshing the token.",
    });
  }
};


const logoutSchema = z.object({
  refreshToken: z.string().trim().min(1),
});

export const logout = async (req: Request, res: Response) => {
  const validation = logoutSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Refresh token is required.",
    });
  }

  try {
    await logoutUser(validation.data.refreshToken);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVALID_REFRESH_TOKEN"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or already revoked refresh token.",
      });
    }

    console.error("Logout error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong during logout.",
    });
  }
};

// VERIFY EMAIL VALIDATION
const verifyEmailSchema = z.object({
  token: z.string().trim().min(1, "Verification token is required."),
});

// POST /api/auth/verify-email (API endpoint)
export const verifyEmail = async (req: Request, res: Response) => {
  const validation = verifyEmailSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Verification token is required.",
    });
  }

  try {
    const user = await verifyEmailToken(validation.data.token);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      data: user,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INVALID_TOKEN") {
        return res.status(400).json({
          success: false,
          message: "Invalid or already-used verification token.",
        });
      }
      if (error.message === "TOKEN_EXPIRED") {
        return res.status(400).json({
          success: false,
          message: "Verification token has expired. Please request a new one.",
        });
      }
    }

    console.error("Email verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong during email verification.",
    });
  }
};

// HTML Templates for Browser verification clicks
const renderVerificationSuccessHtml = () => {
  const deepLink = "apnadukan://auth/email-verified?status=success";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verified — ApnaDukan</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; padding: 24px;
      background-color: #F7F3E9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      display: flex; align-items: center; justify-content: center; min-height: 100vh;
      color: #303630;
    }
    .card {
      background: #FFFFFF;
      max-width: 440px; width: 100%;
      border-radius: 24px;
      padding: 40px 32px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(36, 70, 56, 0.08);
      border: 1px solid #E2DDD4;
    }
    .logo {
      display: inline-flex; align-items: center; justify-content: center;
      width: 56px; height: 56px; border-radius: 16px;
      background: #244638; color: #F7F3E9; margin-bottom: 20px;
      font-size: 26px;
    }
    h1 { color: #244638; font-size: 24px; margin: 0 0 10px; font-weight: 700; letter-spacing: -0.3px; }
    p { color: #586458; font-size: 15px; line-height: 1.5; margin: 0 0 28px; }
    .btn {
      display: block; width: 100%;
      background: #244638; color: #F7F3E9; text-decoration: none;
      padding: 14px 20px; border-radius: 14px; font-weight: 600; font-size: 16px;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity: 0.9; }
    .footer { font-size: 12.5px; color: #8C968C; margin-top: 24px; line-height: 1.4; }
  </style>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.location.href = "${deepLink}";
      }, 300);
    };
  </script>
</head>
<body>
  <div class="card">
    <div class="logo">✓</div>
    <h1>Email Verified!</h1>
    <p>Your email address has been successfully verified. You can now continue in the ApnaDukan app.</p>
    <a href="${deepLink}" class="btn">Open ApnaDukan App</a>
    <div class="footer">If the app did not open automatically, tap the button above.</div>
  </div>
</body>
</html>`;
};

const renderVerificationErrorHtml = (errorMessage: string) => {
  const fallbackLink = "apnadukan://auth/login";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Failed — ApnaDukan</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; padding: 24px;
      background-color: #F7F3E9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      display: flex; align-items: center; justify-content: center; min-height: 100vh;
      color: #303630;
    }
    .card {
      background: #FFFFFF;
      max-width: 440px; width: 100%;
      border-radius: 24px;
      padding: 40px 32px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(36, 70, 56, 0.08);
      border: 1px solid #E2DDD4;
    }
    .logo {
      display: inline-flex; align-items: center; justify-content: center;
      width: 56px; height: 56px; border-radius: 16px;
      background: #D9534F; color: #FFFFFF; margin-bottom: 20px;
      font-size: 26px;
    }
    h1 { color: #244638; font-size: 24px; margin: 0 0 10px; font-weight: 700; letter-spacing: -0.3px; }
    p { color: #586458; font-size: 15px; line-height: 1.5; margin: 0 0 28px; }
    .btn {
      display: block; width: 100%;
      background: #244638; color: #F7F3E9; text-decoration: none;
      padding: 14px 20px; border-radius: 14px; font-weight: 600; font-size: 16px;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity: 0.9; }
    .footer { font-size: 12.5px; color: #8C968C; margin-top: 24px; line-height: 1.4; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">✕</div>
    <h1>Link Expired or Invalid</h1>
    <p>${errorMessage}</p>
    <a href="${fallbackLink}" class="btn">Open ApnaDukan App</a>
    <div class="footer">© 2025 ApnaDukan · Built for India's neighbourhood businesses</div>
  </div>
</body>
</html>`;
};

// GET /api/auth/verify-email (Browser link click from email)
export const verifyEmailWeb = async (req: Request, res: Response) => {
  const token = typeof req.query.token === "string" ? req.query.token : undefined;

  if (!token) {
    return res
      .status(400)
      .send(
        renderVerificationErrorHtml(
          "Missing verification token. Please open the app or request a new verification email."
        )
      );
  }

  try {
    await verifyEmailToken(token);
    return res.status(200).send(renderVerificationSuccessHtml());
  } catch (error) {
    const message =
      error instanceof Error && error.message === "TOKEN_EXPIRED"
        ? "This verification link has expired (links are valid for 15 minutes). Please log in to request a new one."
        : "This verification link is invalid or has already been used. Please log in to continue.";
    return res.status(400).send(renderVerificationErrorHtml(message));
  }
};

// RESEND VERIFICATION VALIDATION
const resendVerificationSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address.")
    .max(254),
});

// POST /api/auth/resend-verification
export const resendVerification = async (req: Request, res: Response) => {
  const validation = resendVerificationSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Valid email is required.",
      errors: validation.error.flatten().fieldErrors,
    });
  }

  try {
    await resendVerificationEmail(validation.data.email);

    return res.status(200).json({
      success: true,
      message:
        "If an unverified account exists with that email, a verification link has been sent.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMITED") {
      return res.status(429).json({
        success: false,
        message:
          "Please wait at least one minute before requesting another verification email.",
      });
    }

    console.error("Resend verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while sending the verification email.",
    });
  }
};


