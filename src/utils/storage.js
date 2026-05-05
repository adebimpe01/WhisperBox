export function saveUserData(data) {
  localStorage.setItem("user", JSON.stringify(data));
}

export function getUserData() {
  const data = localStorage.getItem("user");
  return data ? JSON.parse(data) : null;
}