redirectIfAuthed();

// Initialize password toggle and strength meter
initPasswordToggle('passwordToggle', 'password');
initPasswordStrength('password', 'strengthBar', 'strengthLabel');

const form = document.getElementById('registerForm');
const errorBox = document.getElementById('error');
const submitBtn = document.getElementById('submitBtn');

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.add('show');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.classList.remove('show');

  const payload = {
    displayName: document.getElementById('displayName').value.trim(),
    username: document.getElementById('username').value.trim().toLowerCase(),
    email: document.getElementById('email').value.trim(),
    password: document.getElementById('password').value,
  };
  if (!payload.displayName) delete payload.displayName;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating account…';
  try {
    const { token, user } = await API.post('/auth/register', payload, { auth: false });
    Auth.set(token, user);
    location.href = '/index.html';
  } catch (err) {
    showError(err.message || 'Registration failed');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign up';
  }
});
