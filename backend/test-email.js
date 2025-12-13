#!/usr/bin/env node

const http = require('http');
const chalk = require('chalk');
const figlet = require('figlet');
const readline = require('readline');
const boxen = require('boxen');
const gradient = require('gradient-string');
const ora = require('ora');

// واجهة سطر الأوامر للتفاعل
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// تخصيص تدرج ألوان
const emailGradient = gradient('cyan', 'blue', 'purple');
const successGradient = gradient('green', 'lime');
const errorGradient = gradient('red', 'orange');
const infoGradient = gradient('cyan', 'blue');

// عرض الشعار مع تدرج ألوان
console.log(
  emailGradient(
    figlet.textSync('EMAIL TESTER', {
      font: 'ANSI Shadow',
      horizontalLayout: 'default',
      verticalLayout: 'default',
      width: 80
    })
  )
);

// عرض مربع معلومات
console.log(
  boxen(
    chalk.white.bold('أداة احترافية لاختبار إرسال البريد الإلكتروني') +
    '\n' +
    infoGradient('الإصدار: 2.0.0 | المطور: فريق النظام'),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      backgroundColor: '#0a0a0a'
    }
  )
);

// الحصول على معلمات سطر الأوامر
const args = process.argv.slice(2);
const options = {
  email: args[0] || '',
  port: args[1] || 5000,
  host: args[2] || 'localhost',
  help: args.includes('--help') || args.includes('-h'),
  verbose: args.includes('--verbose') || args.includes('-v'),
  timeout: parseInt(args.find(arg => arg.startsWith('--timeout='))?.split('=')[1] || '10000')
};

// عرض مساعدة محسنة
if (options.help) {
  console.log('\n' + chalk.bold.cyan('📧 أداة اختبار البريد الإلكتروني - المساعدة\n'));
  
  console.log(chalk.white.bold('الاستخدام:\n'));
  console.log(chalk.green('  node test-email.js [email] [port] [host] [options]\n'));
  
  console.log(chalk.white.bold('المعلمات:\n'));
  const params = [
    ['email', 'البريد الإلكتروني المستهدف (اختياري)', 'user@example.com'],
    ['port', 'منفذ الخادم (افتراضي: 5000)', '3000'],
    ['host', 'عنوان الخادم (افتراضي: localhost)', '192.168.1.100'],
    ['--timeout=', 'وقت الانتظار (افتراضي: 10000ms)', '5000']
  ];
  
  params.forEach(([param, desc, example]) => {
    console.log(chalk.cyan(`  ${param.padEnd(15)}`) + chalk.gray(`${desc}`));
    console.log(chalk.dim(`                   مثال: ${example}`) + '\n');
  });
  
  console.log(chalk.white.bold('الخيارات:\n'));
  const flags = [
    ['-h, --help', 'عرض هذه المساعدة'],
    ['-v, --verbose', 'عرض معلومات تفصيلية'],
    ['--debug', 'وضع التصحيح']
  ];
  
  flags.forEach(([flag, desc]) => {
    console.log(chalk.yellow(`  ${flag.padEnd(15)}`) + chalk.gray(`${desc}`));
  });
  
  console.log(chalk.white.bold('\nأمثلة:\n'));
  const examples = [
    ['node test-email.js', 'بدء واجهة تفاعلية'],
    ['node test-email.js user@domain.com', 'اختبار بريد محدد'],
    ['node test-email.js user@domain.com 3000 server.com -v', 'اختبار تفصيلي']
  ];
  
  examples.forEach(([cmd, desc]) => {
    console.log(chalk.green(`  ${cmd}`));
    console.log(chalk.dim(`  ${desc}\n`));
  });
  
  process.exit(0);
}

// طلب البريد الإلكتروني من المستخدم مع واجهة محسنة
function askForEmail() {
  return new Promise((resolve) => {
    console.log('\n' + emailGradient('═'.repeat(50)));
    console.log(emailGradient.bold('📧 إدخال البريد الإلكتروني'));
    console.log(emailGradient('═'.repeat(50)) + '\n');
    
    rl.question(
      chalk.yellow.bold('➤ أدخل البريد الإلكتروني للاختبار: '),
      (email) => {
        if (!email.trim()) {
          console.log(errorGradient('⚠  لم يتم إدخال أي بريد. جاري الخروج...'));
          process.exit(1);
        }
        
        if (!validateEmail(email)) {
          console.log(errorGradient('\n❌ بريد إلكتروني غير صالح!'));
          console.log(chalk.gray('  يجب أن يحتوي البريد على: @ و .com أو .net أو ما شابه'));
          console.log(chalk.gray('  مثال: user@example.com\n'));
          return resolve(askForEmail());
        }
        
        resolve(email.trim());
      }
    );
  });
}

// تحقق من صحة البريد الإلكتروني
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// عرض معلومات الاتصال
function showConnectionInfo(email) {
  console.log('\n' + infoGradient('═'.repeat(50)));
  console.log(infoGradient.bold('🔗 معلومات الاتصال'));
  console.log(infoGradient('═'.repeat(50)));
  
  const info = {
    '📧 البريد المستهدف': chalk.cyan.bold(email),
    '🌐 الخادم': chalk.cyan.bold(`${options.host}:${options.port}`),
    '⏱️  المهلة': chalk.cyan.bold(`${options.timeout}ms`),
    '📡 المسار': chalk.cyan.bold('/api/password/test-email')
  };
  
  Object.entries(info).forEach(([key, value]) => {
    console.log(chalk.white.bold(`${key.padEnd(20)}`) + value);
  });
  
  console.log(infoGradient('═'.repeat(50)) + '\n');
}

// اختبار إرسال البريد
async function testEmail(email) {
  const startTime = Date.now();
  const data = JSON.stringify({ 
    testEmail: email,
    timestamp: new Date().toISOString(),
    source: 'cli-email-tester-v2'
  });

  const requestOptions = {
    hostname: options.host,
    port: options.port,
    path: '/api/password/test-email',
    method: 'POST',
    timeout: options.timeout,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
      'User-Agent': 'Email-Tester-CLI/2.0.0',
      'X-Request-Source': 'cli-tool',
      'Accept': 'application/json'
    }
  };

  showConnectionInfo(email);

  // عرض مؤشر التحميل
  const spinner = ora({
    text: chalk.cyan.bold('🚀 جاري اختبار إرسال البريد...'),
    color: 'cyan',
    spinner: 'dots'
  }).start();

  return new Promise((resolve, reject) => {
    const req = http.request(requestOptions, (res) => {
      let responseData = '';
      const responseTime = Date.now() - startTime;

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        spinner.stop();
        
        // عرض نتيجة الاختبار
        console.log('\n' + (res.statusCode < 300 ? successGradient : errorGradient)('═'.repeat(50)));
        console.log((res.statusCode < 300 ? successGradient : errorGradient).bold(
          res.statusCode < 300 ? '✅ نتيجة الاختبار - ناجح' : '❌ نتيجة الاختبار - فاشل'
        ));
        console.log((res.statusCode < 300 ? successGradient : errorGradient)('═'.repeat(50)));
        
        const stats = {
          '⏱️  وقت الاستجابة': `${responseTime}ms`,
          '📊 حالة الرد': `${res.statusCode} ${res.statusMessage}`,
          '📦 حجم الرد': `${Buffer.byteLength(responseData)} bytes`,
          '📨 البروتوكول': `HTTP/${res.httpVersion}`
        };
        
        Object.entries(stats).forEach(([key, value]) => {
          console.log(chalk.white.bold(`${key.padEnd(20)}`) + 
            (res.statusCode < 300 ? successGradient(value) : errorGradient(value)));
        });
        
        try {
          const parsedData = JSON.parse(responseData);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(successGradient('\n🎉 تم إرسال البريد بنجاح!\n'));
            
            if (options.verbose) {
              console.log(chalk.white.bold('📄 تفاصيل الرد:'));
              console.log(chalk.gray(JSON.stringify(parsedData, null, 2)));
            }
          } else {
            console.log(errorGradient('\n❌ فشل إرسال البريد!\n'));
            console.log(chalk.white.bold('💡 رسالة الخطأ:'));
            console.log(chalk.red(parsedData.message || 'خطأ غير معروف'));
            
            if (options.verbose && parsedData.details) {
              console.log(chalk.white.bold('\n🔍 تفاصيل إضافية:'));
              console.log(chalk.gray(JSON.stringify(parsedData.details, null, 2)));
            }
          }
        } catch (err) {
          console.log(errorGradient('\n⚠  استجابة غير متوقعة من الخادم'));
          console.log(chalk.gray('البيانات الخام:'), responseData.substring(0, 200) + '...');
        }
        
        console.log('\n' + infoGradient('═'.repeat(50)));
        rl.close();
        resolve();
      });
    });

    req.on('error', (error) => {
      spinner.stop();
      
      console.log('\n' + errorGradient('═'.repeat(50)));
      console.log(errorGradient.bold('💥 خطأ في الاتصال'));
      console.log(errorGradient('═'.repeat(50)));
      
      console.log(chalk.white.bold('🔧 نوع الخطأ:'), errorGradient(error.code || 'UNKNOWN'));
      console.log(chalk.white.bold('📝 الرسالة:'), errorGradient(error.message));
      
      console.log(chalk.yellow.bold('\n💡 نصائح استكشاف الأخطاء:'));
      const tips = [
        '✓ تأكد من تشغيل الخادم',
        `✓ تحقق من المنفذ ${options.port}`,
        `✓ تأكد من العنوان ${options.host}`,
        '✓ تحقق من إعدادات الجدار الناري',
        '✓ جرب ping الخادم'
      ];
      
      tips.forEach(tip => console.log(chalk.cyan('  ' + tip)));
      
      console.log('\n' + infoGradient('═'.repeat(50)));
      rl.close();
      reject(error);
    });

    req.on('timeout', () => {
      spinner.stop();
      console.log(errorGradient('\n⏰ انتهت مهلة الطلب!'));
      req.destroy();
      rl.close();
      reject(new Error('Request timeout'));
    });

    // إرسال البيانات
    req.write(data);
    req.end();
  });
}

// تشغيل الاختبار
async function run() {
  try {
    let email = options.email;
    
    if (!email) {
      email = await askForEmail();
    } else if (!validateEmail(email)) {
      console.log(errorGradient('❌ بريد إلكتروني غير صالح!'));
      console.log(chalk.gray('يجب أن يكون بالصيغة: user@example.com'));
      process.exit(1);
    }
    
    await testEmail(email);
  } catch (error) {
    if (!error.message.includes('timeout')) {
      console.error(errorGradient(`\n💥 حدث خطأ غير متوقع: ${error.message}`));
    }
    process.exit(1);
  }
}

// بدء التطبيق
run();