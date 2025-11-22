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

        stage('Build') {
            steps {
                echo "Construyendo PWA..."
                sh 'npm run build'
            }
        }

        stage('Deploy to DEV') {
            when { branch 'develop' }
            steps {
                echo "Subiendo artefactos a DEV..."
                sh 'aws s3 sync dist/ s3://${S3_DEV} --delete'
                sh 'aws cloudfront create-invalidation --distribution-id ${CF_DEV} --paths "/*"'
            }
        }

        stage('Deploy to PROD') {
            when { branch 'main' }
            steps {
                echo "Subiendo artefactos a PROD..."
                sh 'aws s3 sync dist/ s3://${S3_PROD} --delete'
                sh 'aws cloudfront create-invalidation --distribution-id ${CF_PROD} --paths "/*"'
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline ejecutado con éxito"
        }
        failure {
            echo "❌ Falló el pipeline"
        }
    }
}