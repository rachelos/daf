/**
 * 前端加密工具（可选）
 * 
 * 使用方法：
 * 1. 安装依赖: npm install crypto-js
 * 2. 在 api/index.ts 中导入并使用
 * 3. 通过环境变量 VITE_ENCRYPTION_KEY 控制是否启用
 */

import AES from 'crypto-js/aes';
import CryptoJS from 'crypto-js/core';
import ENC from 'crypto-js/enc-utf8';
import Base64 from 'crypto-js/enc-base64';

export class EncryptionUtil {
  private key: string;

  constructor(key: string) {
    // Base64解码密钥
    const keyBuffer = Base64.parse(key);
    if (keyBuffer.sigBytes !== 32) {
      throw new Error('密钥长度必须是32字节（256位）');
    }
    this.key = key;
  }

  /**
   * 加密数据
   */
  encrypt(plaintext: string): string {
    const encrypted = AES.encrypt(plaintext, this.key, {
      mode: CryptoJS.mode.GCM,
      padding: CryptoJS.pad.NoPadding,
      iv: CryptoJS.lib.WordArray.random(16)
    });
    return encrypted.toString();
  }

  /**
   * 解密数据
   */
  decrypt(ciphertext: string): string {
    const decrypted = AES.decrypt(ciphertext, this.key, {
      mode: CryptoJS.mode.GCM,
      padding: CryptoJS.pad.NoPadding
    });
    return decrypted.toString(ENC);
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
    return JSON.parse(this.decrypt(ciphertext)) as T;
  }

  /**
   * 生成随机密钥
   */
  static generateKey(): string {
    const key = CryptoJS.lib.WordArray.random(32);
    return key.toString(Base64);
  }
}

/**
 * 获取加密密钥
 * 从环境变量或localStorage读取
 */
export function getEncryptionKey(): string | null {
  // 优先级: 环境变量 > localStorage
  const envKey = import.meta.env?.VITE_ENCRYPTION_KEY;
  if (envKey) return envKey;
  
  const localKey = localStorage.getItem('encryption_key');
  if (localKey) return localKey;
  
  return null;
}

/**
 * 检查是否启用加密
 */
export function isEncryptionEnabled(): boolean {
  return getEncryptionKey() !== null;
}

/**
 * 创建加密实例
 */
export function createEncryption(): EncryptionUtil | null {
  const key = getEncryptionKey();
  if (!key) return null;
  
  try {
    return new EncryptionUtil(key);
  } catch (error) {
    console.error('创建加密实例失败:', error);
    return null;
  }
}
