redirectIfAuthed();

// Initialize password toggle
initPasswordToggle('passwordToggle', 'password');

const form = document.getElementById('loginForm');
const errorBox = document.getElementById('error');
const submitBtn = document.getElementById('submitBtn');

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.add('show');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.classList.remove('show');
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging in…';
  try {
    const { token, user } = await API.post('/auth/login', { username, password }, { auth: false });
    Auth.set(token, user);
    location.href = '/index.html';
  } catch (err) {
    showError(err.message || 'Login failed');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Log in';
  }
});
