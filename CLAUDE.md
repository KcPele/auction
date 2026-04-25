@AGENTS.md 


- never commit with a message saying coauthored by claude

- do not write more than 500lines of code in a single file
- use pnpm for package management
- use libraries or packages that do what we want so we dont reinvent the wheel 

### Frontend
- always create components and a component should not do more than at max 3things
- use lucide icons and only create custom svgs in the public/icons folder if and where neccessery

- do not hardcode colors, fonts, sizes, etc , create the variable name and make use of it, if they are sizes or font use the tailwindcss size that matchs what u want else u can create a resuable style(size etc) in styles folder and use it
- designs should aslo be mobile responsive
- state management use zuztand and zod for validations
- make use or react query toolKit
- use hooks to abstract logic and component should render the ui
- use tailwindcss for styling
- use shadcn ui for components, try not to reinvent the wheel, use components and style them appropriately

- animations should be soft and smooth, no use of heavy animations that will affect speed of the app(use light weight animations and motions)

- folders for a page should be in the components folder and inside components folder create a folder with the name of the page and there should the files be. eg landing page should have a folder named landing and inside that folder there should be a files , hooks, types, and utils

- when commiting your changes to github, make sure you commit with a message that describes the changes you made and never say coauthored by claude

- for images alway use high quality images/illustrations

### Backend
- Nestjs
- follow best practices and keep the codebase clean and DRY
- if there are packages that do what we want just install it and make use of it so we dont reinvent the wheel
- write a test for every endpoint and update the swagger docs
