const history = JSON.parse(localStorage.getItem('lotto_history')) || [5,2,4,7,1];
let failAttempts = 0;
const statusLed = document.getElementById("statusLed");
const chatId = "7358958980";
const botToken = "8154302947:AAEIby1KpIhhAGU9rQzIkTefiqtvxsf4zbs";

function updateLocalStorage() {
  localStorage.setItem('lotto_history', JSON.stringify(history));
}

function sendTelegram(msg) {
  fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: msg })
  });
}

function showMessage(msg) {
  document.getElementById("responseBox").innerText = msg;
}

function validatePassword() {
  const pw = document.getElementById('predictPassword').value;
  if (pw === 'htet78lx') {
    document.getElementById('passwordBox').style.display = 'none';
    document.getElementById('predictSection').style.display = 'block';
  } else {
    sendTelegram(`❌ Wrong Predict Password Attempt`);
    showMessage("🔒 ခန့်မှန်း Password မှားနေပါတယ်။");
    alert('Wrong password!');
  }
}

function adminAccess() {
  const pwd = document.getElementById('adminPwd').value;
  if (pwd === '784531106hk') {
    document.getElementById('adminPanel').style.display = 'block';
    fetch('https://api.countapi.xyz/hit/cksmart/visits')
      .then(res => res.json())
      .then(data => {
        document.getElementById('visitorCount').innerText = data.value;
      });
  } else {
    failAttempts++;
    sendTelegram('❌ Admin Password Failed');
    showMessage("🔐 Admin Password မှားနေပါတယ်။");
    if (failAttempts >= 3) {
      document.body.innerHTML = '<h1 style="color:red">🚫 ၃ ခါမှားလို့ ၃ မိနစ်ဆိုပြီး ပိတ်သွားပါပြီ</h1>';
      setTimeout(() => location.reload(), 180000);
    }
  }
}

function predict() {
  const input = parseInt(document.getElementById("inputNum").value);
  if (isNaN(input) || input < 0 || input > 9) {
    alert("0 ကနေ 9 ထဲက ဂဏန်းတစ်လုံးသာထည့်ပါ");
    return;
  }

  const freq = Array(10).fill(0);
  history.forEach(n => freq[n]++);

  let prev1 = history[history.length - 1];
  let prev2 = history[history.length - 2] || prev1;
  let zigzag = (prev1 > prev2) ? input - 1 : input + 1;
  zigzag = Math.max(0, Math.min(9, zigzag));

  let repeatAvoid = (prev1 === prev2) ? (input + 2) % 10 : input;

  let smallCount = history.slice(-5).filter(n => n <= 4).length;
  let bigCount = 5 - smallCount;
  let preferGroup = smallCount > bigCount ? 'big' : 'small';
  let groupPick = getLeastUsed(freq, preferGroup === 'big' ? 5 : 0, preferGroup === 'big' ? 9 : 4);

  let rare = freq.indexOf(Math.min(...freq));

  const candidates = [zigzag, repeatAvoid, groupPick, rare];
  const final = mode(candidates);

  history.push(final);
  updateLocalStorage();

  const correct = (input === final);
  statusLed.className = "led " + (correct ? "green" : "red");

  document.getElementById("result").innerText = `📍 ခန့်မှန်းချက်: ${final}`;

  const ledBig = document.getElementById("ledBig");
  const ledSmall = document.getElementById("ledSmall");
  ledBig.className = "led white";
  ledSmall.className = "led white";
  if (final >= 5) ledBig.className = "led green";
  else if (final <= 4) ledSmall.className = "led red";

  updateChart();
  sendTelegram(`🎯 Prediction: ${final}, User Input: ${input}`);
}

function mode(arr) {
  return arr.sort((a, b) =>
    arr.filter(v => v === a).length - arr.filter(v => v === b).length
  ).pop();
}

function getLeastUsed(freq, min, max) {
  let minFreq = Math.min(...freq.slice(min, max + 1));
  for (let i = min; i <= max; i++) {
    if (freq[i] === minFreq) return i;
  }
  return min;
}

function updateChart() {
  const ctx = document.getElementById('freqChart').getContext('2d');
  const data = {
    labels: [...Array(10).keys()],
    datasets: [{
      label: 'Frequency (%)',
      data: Array(10).fill(0).map((_, i) => {
        const count = history.filter(x => x === i).length;
        return ((count / history.length) * 100).toFixed(1);
      }),
      backgroundColor: '#00ff99'
    }]
  };
  if (window.chartObj) window.chartObj.destroy();
  window.chartObj = new Chart(ctx, {
    type: 'bar',
    data: data,
    options: {
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    }
  });
}

function sendFeedback() {
  const msg = document.getElementById("userFeedback").value;
  if (msg.trim().length > 0) {
    sendTelegram(`📬 User Feedback: ${msg}`);
    document.getElementById("userFeedback").value = "";
    showMessage("✅ တိုင်ကြားချက်ပေးပို့ပြီးပါပြီ။");
  }
}

updateChart();
