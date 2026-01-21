// Entorno de staging para desarrollo local
// Este archivo se usa cuando se construye con: ng build --configuration=staging
export const environment = {
  production: false, // Staging no es producción
  apiUrl: 'http://localhost:8080',
  // NOTA: El Google Client ID es público (OAuth Client ID) y puede estar en el repositorio.
  // Si necesitas usar un ID diferente para staging, reemplázalo aquí.
  googleClientIdWeb: '762283064675-ef4hg9vdbelpmkehtn1u34fk6o5dethj.apps.googleusercontent.com'
};
