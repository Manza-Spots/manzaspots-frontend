<script setup>
import { ref } from 'vue'
import { useToast } from '@/shared/composables/useToast'
import { useRouter } from 'vue-router'
import { useAuth } from '@/features/auth/composables/useAuth'
import Icon from '@/shared/components/Icon.vue'
import Button from '@/shared/components/ButtonComponent.vue'
import Input from '@/shared/components/InputComponent.vue'
import Textarea from '@/shared/components/Textarea.vue'
import Select from '@/shared/components/Select.vue'
import Checkbox from '@/shared/components/CheckboxComponent.vue'
import Radio from '@/shared/components/Radio.vue'
import RadioGroup from '@/shared/components/RadioGroup.vue'
import Switch from '@/shared/components/Switch.vue'
import Card from '@/shared/components/Card.vue'
import Badge from '@/shared/components/Badge.vue'
import Alert from '@/shared/components/Alert.vue'
import Modal from '@/shared/components/Modal.vue'
import Avatar from '@/shared/components/Avatar.vue'

const toast = useToast()
const router = useRouter()
const { isAuthenticated, user, logout } = useAuth()

const email = ref('')
const password = ref('')
const description = ref('')
const limitedText = ref('')
const country = ref('')
const hobbies = ref([])
const gender = ref('male')
const difficulty = ref('easy')
const notifications = ref(true)
const showModal = ref(false)

const countries = [
  { label: 'México', value: 'mx' },
  { label: 'Estados Unidos', value: 'us' },
  { label: 'España', value: 'es' },
  { label: 'Argentina', value: 'ar' },
]

const handleToast = (variant) => {
  toast[variant](`Este es un ${variant} toast`, { duration: 3000 })
}

const handleLogout = async () => {
  try {
    await logout()
  } catch (error) {
    console.error('Logout err:', error)
  }
}
</script>

<template>
  <div class="ui-showcase">
    <div class="container">
      <header class="showcase-header">
        <h1>Sistema de Diseño</h1>
        <p>Todos los componentes base de la aplicación</p>
        <Card v-if="isAuthenticated" class="auth-card">
          <div class="auth-info">
            <div class="auth-user">
              <Avatar :name="user?.email || 'Usuario'" size="md" />
              <div class="user-details">
                <p class="user-email">{{ user?.email || 'usuario@example.com' }}</p>
                <Badge variant="success" dot>Autenticado</Badge>
              </div>
            </div>
            <Button variant="danger" size="sm" @click="router.push('/')">
              <Icon name="Home" :size="16" />
              Home
            </Button>
            <Button variant="danger" size="sm" @click="handleLogout">
              <Icon name="LogOut" :size="16" />
              Cerrar Sesión
            </Button>
          </div>
        </Card>
      </header>

      <section class="showcase-section">
        <h2>Iconos</h2>
        <Card padding="lg">
          <div class="icon-grid">
            <div class="icon-item">
              <Icon name="MapPin" :size="24" />
              <span>MapPin</span>
            </div>
            <div class="icon-item">
              <Icon name="Navigation" :size="24" />
              <span>Navigation</span>
            </div>
            <div class="icon-item">
              <Icon name="Mountain" :size="24" />
              <span>Mountain</span>
            </div>
            <div class="icon-item">
              <Icon name="Compass" :size="24" />
              <span>Compass</span>
            </div>
            <div class="icon-item">
              <Icon name="Activity" :size="24" />
              <span>Activity</span>
            </div>
            <div class="icon-item">
              <Icon name="User" :size="24" />
              <span>User</span>
            </div>
            <div class="icon-item">
              <Icon name="Settings" :size="24" />
              <span>Settings</span>
            </div>
            <div class="icon-item">
              <Icon name="Heart" :size="24" />
              <span>Heart</span>
            </div>
          </div>
        </Card>
      </section>

      <section class="showcase-section">
        <h2>Botones</h2>
        <Card padding="lg">
          <div class="component-group">
            <h3>Variantes</h3>
            <div class="button-group">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
          </div>

          <div class="component-group">
            <h3>Tamaños</h3>
            <div class="button-group">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>

          <div class="component-group">
            <h3>Estados</h3>
            <div class="button-group">
              <Button :loading="true">Loading</Button>
              <Button :disabled="true">Disabled</Button>
              <Button full-width>Full Width</Button>
            </div>
          </div>
        </Card>
      </section>

      <section class="showcase-section">
        <h2>Inputs</h2>
        <Card padding="lg">
          <div class="form-grid">
            <Input
              v-model="email"
              label="Email"
              type="email"
              placeholder="tu@email.com"
              icon="Mail"
            />

            <Input
              v-model="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              icon="Lock"
            />

            <Input
              label="Con error"
              placeholder="Input con error"
              error="Este campo tiene un error"
            />

            <Input label="Deshabilitado" placeholder="Input deshabilitado" :disabled="true" />
          </div>
        </Card>
      </section>

      <section class="showcase-section">
        <h2>Textarea</h2>
        <Card padding="lg">
          <div class="form-grid">
            <Textarea
              v-model="description"
              label="Descripción"
              placeholder="Escribe una descripción..."
              :rows="4"
            />

            <Textarea
              v-model="limitedText"
              label="Con contador"
              placeholder="Máximo 200 caracteres"
              :max-length="200"
              :show-count="true"
              :rows="3"
            />
          </div>
        </Card>
      </section>

      <section class="showcase-section">
        <h2>Select</h2>
        <Card padding="lg">
          <div class="form-grid">
            <Select
              v-model="country"
              label="País"
              placeholder="Selecciona un país"
              :options="countries"
            />

            <Select label="Select deshabilitado" :options="countries" :disabled="true" />
          </div>
        </Card>
      </section>

      <section class="showcase-section">
        <h2>Checkbox</h2>
        <Card padding="lg">
          <div class="component-group">
            <h3>Individual</h3>
            <Checkbox v-model="notifications" label="Recibir notificaciones" />
          </div>

          <div class="component-group">
            <h3>Grupo</h3>
            <div class="checkbox-group">
              <Checkbox v-model="hobbies" value="hiking" label="Hiking" />
              <Checkbox v-model="hobbies" value="cycling" label="Ciclismo" />
              <Checkbox v-model="hobbies" value="running" label="Running" />
              <Checkbox v-model="hobbies" value="camping" label="Camping" />
            </div>
          </div>

          <div class="component-group">
            <h3>Tamaños</h3>
            <div class="checkbox-group horizontal">
              <Checkbox size="sm" label="Small" />
              <Checkbox size="md" label="Medium" />
              <Checkbox size="lg" label="Large" />
            </div>
          </div>
        </Card>
      </section>

      <section class="showcase-section">
        <h2>Radio</h2>
        <Card padding="lg">
          <RadioGroup v-model="gender" name="gender" label="Género" direction="vertical">
            <Radio name="gender" value="male" label="Masculino" />
            <Radio name="gender" value="female" label="Femenino" />
            <Radio name="gender" value="other" label="Otro" />
          </RadioGroup>

          <div class="component-group">
            <h3>Horizontal</h3>
            <RadioGroup
              v-model="difficulty"
              name="difficulty"
              label="Dificultad"
              direction="horizontal"
            >
              <Radio name="difficulty" value="easy" label="Fácil" />
              <Radio name="difficulty" value="medium" label="Medio" />
              <Radio name="difficulty" value="hard" label="Difícil" />
            </RadioGroup>
          </div>
        </Card>
      </section>

      <section class="showcase-section">
        <h2>Switch</h2>
        <Card padding="lg">
          <div class="switch-group">
            <Switch v-model="notifications" label="Notificaciones" />
            <Switch v-model="notifications" label="Modo oscuro" size="sm" />
            <Switch v-model="notifications" label="Ubicación" size="lg" />
            <Switch v-model="notifications" label="Deshabilitado" :disabled="true" />
          </div>
        </Card>
      </section>

      <section class="showcase-section">
        <h2>Badges</h2>
        <Card padding="lg">
          <div class="component-group">
            <h3>Variantes</h3>
            <div class="badge-group">
              <Badge variant="default">Default</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="info">Info</Badge>
            </div>
          </div>

          <div class="component-group">
            <h3>Con punto</h3>
            <div class="badge-group">
              <Badge variant="success" dot>Activo</Badge>
              <Badge variant="error" dot>Inactivo</Badge>
              <Badge variant="warning" dot>Pendiente</Badge>
            </div>
          </div>

          <div class="component-group">
            <h3>Redondeados</h3>
            <div class="badge-group">
              <Badge variant="primary" rounded>Beta</Badge>
              <Badge variant="success" rounded>Nuevo</Badge>
              <Badge variant="warning" rounded>Pro</Badge>
            </div>
          </div>
        </Card>
      </section>

      <section class="showcase-section">
        <h2>Alertas</h2>
        <Card padding="lg">
          <div class="alert-group">
            <Alert variant="info" title="Información">
              Esta es una alerta informativa con título.
            </Alert>

            <Alert variant="success" title="Éxito"> La operación se completó correctamente. </Alert>

            <Alert variant="warning" title="Advertencia"> Ten cuidado con esta acción. </Alert>

            <Alert variant="error" title="Error" :closable="true">
              Ocurrió un error. Esta alerta se puede cerrar.
            </Alert>
          </div>
        </Card>
      </section>

      <section class="showcase-section">
        <h2>Avatars</h2>
        <Card padding="lg">
          <div class="component-group">
            <h3>Tamaños</h3>
            <div class="avatar-row">
              <Avatar size="xs" name="Juan Pérez" />
              <Avatar size="sm" name="Juan Pérez" />
              <Avatar size="md" name="Juan Pérez" />
              <Avatar size="lg" name="Juan Pérez" />
              <Avatar size="xl" name="Juan Pérez" />
              <Avatar size="2xl" name="Juan Pérez" />
            </div>
          </div>

          <div class="component-group">
            <h3>Con imagen</h3>
            <div class="avatar-row">
              <Avatar
                size="lg"
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                alt="Usuario"
              />
              <Avatar
                size="lg"
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka"
                alt="Usuario"
              />
              <Avatar
                size="lg"
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Maria"
                alt="Usuario"
              />
            </div>
          </div>

          <div class="component-group">
            <h3>Con estado</h3>
            <div class="avatar-row">
              <Avatar size="lg" name="JD" status="online" />
              <Avatar size="lg" name="MP" status="offline" />
              <Avatar size="lg" name="LG" status="away" />
              <Avatar size="lg" name="KM" status="busy" />
            </div>
          </div>

          <div class="component-group">
            <h3>Formas</h3>
            <div class="avatar-row">
              <Avatar size="lg" name="JD" shape="circle" />
              <Avatar size="lg" name="MP" shape="rounded" />
              <Avatar size="lg" name="LG" shape="square" />
            </div>
          </div>

          <div class="component-group">
            <h3>Con icono</h3>
            <div class="avatar-row">
              <Avatar size="lg" icon="User" />
              <Avatar size="lg" icon="Mountain" />
              <Avatar size="lg" icon="Compass" />
            </div>
          </div>
        </Card>
      </section>

      <section class="showcase-section">
        <h2>Cards</h2>
        <div class="card-grid">
          <Card padding="md" shadow="sm">
            <h3>Shadow SM</h3>
            <p>Card con sombra pequeña</p>
          </Card>

          <Card padding="md" shadow="md">
            <h3>Shadow MD</h3>
            <p>Card con sombra mediana</p>
          </Card>

          <Card padding="md" shadow="lg">
            <h3>Shadow LG</h3>
            <p>Card con sombra grande</p>
          </Card>

          <Card padding="lg" shadow="md" hover>
            <h3>Hover Effect</h3>
            <p>Card con efecto hover</p>
          </Card>

          <Card padding="lg" shadow="md" bordered>
            <h3>Con borde</h3>
            <p>Card con borde</p>
          </Card>
        </div>
      </section>

      <section class="showcase-section">
        <h2>Modal</h2>
        <Card padding="lg">
          <Button @click="showModal = true">Abrir Modal</Button>
        </Card>
      </section>

      <section class="showcase-section">
        <h2>Toast / Notificaciones</h2>
        <Card padding="lg">
          <div class="button-group">
            <Button variant="primary" @click="handleToast('info')"> Info Toast </Button>
            <Button variant="primary" @click="handleToast('success')"> Success Toast </Button>
            <Button variant="primary" @click="handleToast('warning')"> Warning Toast </Button>
            <Button variant="primary" @click="handleToast('error')"> Error Toast </Button>
          </div>
        </Card>
      </section>
    </div>

    <Modal v-model="showModal" title="Ejemplo de Modal" size="md">
      <div class="modal-content">
        <p>Este es un ejemplo de modal con nuestro sistema de diseño.</p>
        <Input
          v-model="email"
          type="email"
          placeholder="correo@ejemplo.com"
          icon="Mail"
          label="Tu email"
        />
      </div>

      <template #footer>
        <Button variant="ghost" @click="showModal = false">Cancelar</Button>
        <Button variant="primary" @click="showModal = false">Confirmar</Button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.ui-showcase {
  padding: var(--space-8) 0;
  min-height: 100vh;
  background-color: var(--color-bg-secondary);
}

.showcase-header {
  text-align: center;
  margin-bottom: var(--space-12);
}

.showcase-header h1 {
  margin-bottom: var(--space-2);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.showcase-header p {
  color: var(--color-text-secondary);
  font-size: var(--text-lg);
}

.showcase-section {
  margin-bottom: var(--space-10);
}

.showcase-section h2 {
  margin-bottom: var(--space-4);
  font-size: var(--text-2xl);
  color: var(--color-text-primary);
}

.component-group {
  margin-bottom: var(--space-6);
}

.component-group:last-child {
  margin-bottom: 0;
}

.component-group h3 {
  margin-bottom: var(--space-3);
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
  font-weight: var(--font-medium);
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: var(--space-4);
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  transition: background-color var(--transition-fast);
}

.icon-item:hover {
  background-color: var(--color-bg-secondary);
}

.icon-item span {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

.button-group,
.badge-group,
.checkbox-group,
.switch-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}

.checkbox-group {
  flex-direction: column;
  align-items: flex-start;
}

.checkbox-group.horizontal {
  flex-direction: row;
}

.switch-group {
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-4);
}

.form-grid {
  display: grid;
  gap: var(--space-4);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--space-4);
}

.alert-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.avatar-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: center;
}

.modal-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
