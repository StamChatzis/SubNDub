# SubAndDub

A helping platform to assist you with creating Subtitles for Youtube Videos, along with built-in translation tools and ChatGPT text manipulation.

## Required Configuration

To run this locally you will need a Firestore configuration for a schema and Storage bucket. If you want to utilize ChatGPT in subtitling you will need a valid API Key. Make sure to save these in your enviroment files and import them in the corresponding services to be used.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## EmailJS Configuration

To send email notifications you will have to create 2 templates on EmailJS. 
You can find the html files for both templates on `email_template.html` and `email_SharedTemplate.html`
