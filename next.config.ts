import type { NextConfig } from 'next'
import type { WebpackPluginInstance } from 'webpack'

const nextConfig: NextConfig = {
  experimental: {
    // Disable PPR for faster dev server startup during testing
    ppr: process.env.NODE_ENV === 'production',
  },
  serverExternalPackages: ['pino'],
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },

  /**
   * Кастомная конфигурация Webpack для подавления всех логов от tsconfig-paths плагинов.
   * @param {import('webpack').Configuration} config - Текущая конфигурация Webpack.
   * @returns {import('webpack').Configuration} - Измененная конфигурация.
   */
  webpack: (config) => {
    // Подавляем логи от всех tsconfig-paths плагинов
    if (config.resolve?.plugins) {
      config.resolve.plugins.forEach((plugin: WebpackPluginInstance) => {
        const pluginName = plugin.constructor.name
        
        // Подавляем логи от различных вариантов tsconfig-paths плагинов
        if (pluginName === 'TsconfigPathsPlugin' || 
            pluginName.includes('tsconfig') || 
            pluginName.includes('TsConfig')) {
          
          // Устанавливаем максимальное подавление логов
          const pluginOptions = (plugin as any).options || {}
          pluginOptions.silent = true
          pluginOptions.logLevel = 'silent'
          pluginOptions.logInfoToStdOut = false
          
          // Присваиваем обратно для гарантии
          if ((plugin as any).options) {
            (plugin as any).options = { ...pluginOptions }
          }
        }
      })
    }

    // Дополнительно подавляем webpack логи в development
    if (process.env.NODE_ENV === 'development') {
      config.stats = {
        ...config.stats,
        moduleTrace: false,
        errorDetails: false,
      }
    }

    return config
  },
}

export default nextConfig
