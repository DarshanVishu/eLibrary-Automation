pipeline {
    agent any

    tools {
        maven 'Maven-3'
        jdk 'JDK-17'
    }

    stages {
        stage('Checkout eLibrary Code') {
            steps {
                checkout scm
            }
        }

        stage('Compile Test Suite') {
            steps {
                bat 'mvn clean compile test-compile'
            }
        }

        stage('Execute eLibrary Tests') {
            steps {
                bat 'mvn test -Dsurefire.useFile=false'
            }
        }
    }

    post {
        always {
            junit 'target/surefire-reports/*.xml'
        }
        success {
            echo 'eLibrary automation test suite executed successfully!'
        }
        failure {
            echo 'eLibrary pipeline failed. Review console logs.'
        }
    }
}
