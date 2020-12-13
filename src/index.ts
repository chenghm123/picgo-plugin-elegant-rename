import path from 'path'
import picgo from 'picgo'
import utility from 'utility'
import dayjs from 'dayjs'

const pluginConfig = ctx => {
  let userConfig = ctx.getConfig('picgo-plugin-elegant-rename')
  if (!userConfig) {
    userConfig = {}
  }
  return [
    {
      name: 'prefix',
      type: 'input',
      alias: '文件名个性前缀格式',
      default: userConfig.prefix || '',
      message: '例如 images/ 或者 image-',
      required: false
    }
  ]
}

function getElegantName (userConfig, filename) {
  let now = dayjs()
  let rs = utility.randomString(3, utility.md5(`${filename}${now.unix()}`))
  let basename = `${now.format('HHmmss')}${rs}${path.extname(filename)}`

  let elegantName = `${userConfig.prefix}/${now.format('YYYYMMDD')}/${basename}`
      .split(/[\\\/]/).join('/')

  if (elegantName.startsWith('/')) return elegantName.substring(1)
  return elegantName
}

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

export = (ctx: picgo) => {
  const register = () => {
    ctx.helper.beforeUploadPlugins.register('elegant-rename', {
      async handle (ctx) {
        // 冲突配置检验
        const autoRename = ctx.getConfig('settings.autoRename')
        if (autoRename) {
          ctx.emit('notification', {
            title: '❌ 警告',
            body: '请关闭 PicGo 的 【时间戳重命名】 功能,\nelegant-rename 插件重命名方式会被覆盖'
          })
          await sleep(10000)
          throw new Error('elegant-rename conflict')
        }

        // 获取用户配置
        let userConfig = ctx.getConfig('picgo-plugin-elegant-rename')
        if (!userConfig) {
          userConfig = { prefix: '' }
        }

        for (let i = 0; i < ctx.output.length; i++) {
          ctx.output[i].fileName = getElegantName(userConfig, ctx.output[i].fileName)
        }
      },
      config: pluginConfig
    })
  }
  return {
    register,
    config: pluginConfig
  }
}
