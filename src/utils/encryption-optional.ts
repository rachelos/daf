/**
 * 前端加密工具（使用 crypto-js + AES-256-CBC）
 *
 * 使用方法：
 * 1. 从后端API获取加密密钥
 * 2. 在 api/index.ts 中导入并使用
 */

import CryptoJS from 'crypto-js';

export class EncryptionUtil {
  private key: CryptoJS.lib.WordArray;

  constructor(base64Key: string) {
    // Base64解码密钥
    this.key = CryptoJS.enc.Base64.parse(base64Key);
    if (this.key.sigBytes !== 32) {
      throw new Error('密钥长度必须是32字节（256位）');
    }
  }

  /**
   * 加密数据（使用AES-256-CBC）
   * 返回base64编码的 iv + ciphertext
   */
  encrypt(plaintext: string): string {
    // 生成随机IV（16字节）
    const iv = CryptoJS.lib.WordArray.random(16);

    // 使用AES-CBC加密
    const encrypted = CryptoJS.AES.encrypt(plaintext, this.key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    // crypto-js的加密输出已经包含了IV（在salt部分）
    // 但我们需要确保格式与后端一致
    // Go的CBC格式：iv || ciphertext
    // 提取IV和密文
    const ciphertext = encrypted.ciphertext;
    const combined = CryptoJS.lib.WordArray.create(
      iv.words.concat(ciphertext.words),
      iv.sigBytes + ciphertext.sigBytes
    );

    return CryptoJS.enc.Base64.stringify(combined);
  }

  /**
   * 解密数据
   */
  decrypt(ciphertext: string): string {
    // 解码base64
    const combined = CryptoJS.enc.Base64.parse(ciphertext);

    // 提取IV（前16字节）和密文
    const iv = CryptoJS.lib.WordArray.create(
      combined.words.slice(0, 4), // 16字节 = 4个32位字
      16
    );
    const cipherData = CryptoJS.lib.WordArray.create(
      combined.words.slice(4),
      combined.sigBytes - 16
    );

    // 解密
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: cipherData } as CryptoJS.lib.CipherParams,
      this.key,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );

    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  /**
   * 加密JSON对象
   */
  encryptJSON(obj: any): string {
    return this.encrypt(JSON.stringify(obj));
  }

  /**
   * 解密JSON对象
   */
  decryptJSON<T = any>(ciphertext: string): T {
    const plaintext = this.decrypt(ciphertext);
    return JSON.parse(plaintext) as T;
  }

  /**
   * 生成随机密钥
   */
  static generateKey(): string {
    const key = CryptoJS.lib.WordArray.random(32);
    return CryptoJS.enc.Base64.stringify(key);
  }
}

/**
 * 缓存的加密密钥（从后端获取）
 */
let cachedEncryptionKey: string | null = null;
let encryptionKeyFetchPromise: Promise<void> | null = null;

/**
 * 从后端API获取加密密钥
 */
async function fetchEncryptionKeyFromBackend(): Promise<void> {
  if (encryptionKeyFetchPromise) {
    return encryptionKeyFetchPromise;
  }

  encryptionKeyFetchPromise = (async () => {
    try {
      console.log('从后端获取加密密钥...');
      const response = await fetch('/api/v1/system/encryption-key');
      const result = await response.json();

      if (result.success && result.data?.enabled && result.data?.key) {
        cachedEncryptionKey = result.data.key;
        console.log('成功获取加密密钥');
      } else {
        console.log('后端未启用加密');
        cachedEncryptionKey = null;
      }
    } catch (error) {
      console.error('获取加密密钥失败:', error);
      cachedEncryptionKey = null;
    } finally {
      encryptionKeyFetchPromise = null;
    }
  })();

  return encryptionKeyFetchPromise;
}

/**
 * 获取加密密钥
 * 优先从缓存读取，如果没有则从后端获取
 */
export async function getEncryptionKey(): Promise<string | null> {
  // 如果已有缓存，直接返回
  if (cachedEncryptionKey !== null) {
    return cachedEncryptionKey;
  }

  // 从后端获取
  await fetchEncryptionKeyFromBackend();
  return cachedEncryptionKey;
}

/**
 * 检查是否启用加密（异步版本）
 */
export async function isEncryptionEnabled(): Promise<boolean> {
  const key = await getEncryptionKey();
  return key !== null;
}

/**
 * 创建加密实例（异步版本）
 */
export async function createEncryption(): Promise<EncryptionUtil | null> {
  const key = await getEncryptionKey();
  if (!key) return null;

  try {
    return new EncryptionUtil(key);
  } catch (error) {
    console.error('创建加密实例失败:', error);
    return null;
  }
}

/**
 * 同步版本的加密密钥获取（用于已缓存的密钥）
 */
export function getEncryptionKeySync(): string | null {
  return cachedEncryptionKey;
}

/**
 * 同步版本的加密启用检查
 */
export function isEncryptionEnabledSync(): boolean {
  return cachedEncryptionKey !== null;
}

/**
 * 同步版本的创建加密实例
 */
export function createEncryptionSync(): EncryptionUtil | null {
  const key = getEncryptionKeySync();
  if (!key) return null;

  try {
    return new EncryptionUtil(key);
  } catch (error) {
    console.error('创建加密实例失败:', error);
    return null;
  }
}
