import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import * as authService from '@services/auth.service';
import * as tokenService from '@services/token.service';
import { SuccessResponse } from '@utils/response';
import { AuthMessages } from '@constants/messages';
import { env } from '@config/env';

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: User's password
 *             example:
 *               name: John Doe
 *               email: john.doe@example.com
 *               password: password123
 *     responses:
 *       "201":
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "409":
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.registerUser(req.body);
    new SuccessResponse(httpStatus.CREATED, AuthMessages.REGISTRATION_SUCCESS, { user: { id: user.id, email: user.email, name: user.name, role: user.role } }).send(res);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *             example:
 *               email: admin@example.com
 *               password: password123
 *     responses:
 *       "200":
 *         description: Logged in successfully
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: accessToken=jwttoken; Path=/; HttpOnly; Secure; SameSite=Lax
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.loginUser(email, password);

    tokenService.setAuthCookies(res, accessToken, refreshToken);

    new SuccessResponse(httpStatus.OK, AuthMessages.LOGIN_SUCCESS, { user: { id: user.id, email: user.email, name: user.name, role: user.role } }).send(res);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out a user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Logged out successfully
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Clear the refresh token from the database if it exists
    const refreshToken = req.cookies[env.jwtCookieNameRefresh];
    if (refreshToken) {
      await tokenService.deleteRefreshToken(refreshToken);
    }
    
    tokenService.clearAuthCookies(res);
    new SuccessResponse(httpStatus.OK, AuthMessages.LOGOUT_SUCCESS).send(res);
  } catch (error) {
    next(error); // Should not typically fail unless cookie clearing causes an issue
  }
};

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     description: Uses the refresh token from cookies to issue a new access token.
 *     responses:
 *       "200":
 *         description: Access token refreshed successfully
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: accessToken=new_jwt_token; Path=/; HttpOnly; Secure; SameSite=Lax
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
export const refreshTokens = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies[env.jwtCookieNameRefresh];
    if (!refreshToken) {
      return new SuccessResponse(httpStatus.UNAUTHORIZED, AuthMessages.REFRESH_TOKEN_MISSING).send(res);
    }

    const { newAccessToken, newRefreshToken, user } = await tokenService.refreshTokens(refreshToken);

    tokenService.setAuthCookies(res, newAccessToken, newRefreshToken);
    new SuccessResponse(httpStatus.OK, AuthMessages.ACCESS_TOKEN_REFRESHED, { user: { id: user.id, email: user.email, name: user.name, role: user.role } }).send(res);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset link
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       "200":
 *         description: Password reset link sent if email exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 */
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.sendPasswordResetEmail(req.body.email);
    new SuccessResponse(httpStatus.OK, AuthMessages.PASSWORD_RESET_LINK_SENT).send(res);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset user password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: The password reset token received via email
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: The new password for the user
 *     responses:
 *       "200":
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.resetUserPassword(req.body.token, req.body.newPassword);
    new SuccessResponse(httpStatus.OK, AuthMessages.PASSWORD_RESET_SUCCESS).send(res);
  } catch (error) {
    next(error);
  }
};