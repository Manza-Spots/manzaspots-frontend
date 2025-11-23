pipeline {
    agent any

    environment {
        PROJECT_NAME = "manza-spots"
        AWS_REGION = "us-east-2"
        S3_DEV = "manzaspots-pwa-dev"
        S3_PROD = "manzaspots-pwa-prod"
        CF_DEV = "E2RYJ6R8DR2H4A"
        CF_PROD = "E1MTDWWF0FJ2NH"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install dependencies') {
            steps {
                echo "Instalando dependencias..."
                sh 'npm install'
            }
        }
        
        stage('Quality Checks') {
            parallel {
                stage('Lint') {
                    steps {
                        echo "Verificando estilo de código..."
                        sh "npm run lint"
                    }
                }
                
                stage('Unit Test') {
                    steps {
                        echo "Ejecutando test"
                        sh 'npm run test:unit'
                    }
                }
            }
        }

        stage('Build') {
            steps {
                echo "Construyendo PWA..."
                sh 'npm run build'
            }
        }

        stage('Deploy to DEV') {
            when { branch 'develop' }
            steps {
                echo " Desplegando a DEVELOP..."
                sh '''
                    aws s3 sync dist/ s3://${S3_DEV} \
                        --delete \
                        --cache-control "public, max-age=31536000" \
                        --exclude "index.html"
                    
                    aws s3 cp dist/index.html s3://${S3_DEV}/index.html \
                        --cache-control "no-cache"
                    
                    aws cloudfront create-invalidation \
                        --distribution-id ${CF_DEV} \
                        --paths "/*"
                '''
                echo "Deploy completado en DEVELOP"
            }
        }

        stage('Deploy to PROD') {
            when { branch 'main' }
            steps {
                echo "Desplegando a PRODUCCIÓN..."
                sh '''
                    aws s3 sync dist/ s3://${S3_PROD} \
                        --delete \
                        --cache-control "public, max-age=31536000" \
                        --exclude "index.html"
                    
                    aws s3 cp dist/index.html s3/${S3_PROD}/index.html \
                        --cache-control "no-cache"
                    
                    aws cloudfront create-invalidation \
                        --distribution-id ${CF_PROD} \
                        --paths "/*"
                '''
                echo "Deploy completado en PRODUCCIÓN"
            }
        }
    }

    post {
        success {
            echo "Pipeline ejecutado con éxito para ${env.BRANCH_NAME}"
        }

        failure {
            echo "Falló el pipeline en ${env.BRANCH_NAME}"
            echo "Ver detalles en: ${env.BUILD_URL}"
        }

        always {
            cleanWs()
        }
    }
}