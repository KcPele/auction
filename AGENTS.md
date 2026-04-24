@AGENTS.md

- do not write more than 500lines of code in a single file


### Frontend
- always create components and a component should not do more than at max 3things

- use hooks to abstract logic and component should render the ui
- use tailwindcss for styling
- use shadcn ui for components
- animations should be soft and smooth, no use of heavy animations that will affect speed of the app(use light weight animations and motions)

- folders for a page should be in the components folder and inside components folder create a folder with the name of the page and there should the files be. eg landing page should have a folder named landing and inside that folder there should be a files , hooks, types, and utils

- when commiting your changes to github, make sure you commit with a message that describes the changes you made and never say coauthored by claude

- for images alway use high quality images/illustrations

### Backend
- Nestjs
- follow best practices and keep the codebase clean and DRY
- if there are packages that do what we want just install it and make use of it so we dont reinvent the wheel
- every endpoint should be tested and the swagger docs should be updated
