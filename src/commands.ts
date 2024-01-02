// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }
import clipboard from "clipboardy";

cy.get("test");

// Cypress.Commands.add("paste", { prevSubject: true }, (subject) => {
//   // https://gist.github.com/nickytonline/bcdef8ef00211b0faf7c7c0e7777aaf6
//   subject.then(($destination) => {
//     clipboard.read().then((data) => {
//       const pasteEvent = Object.assign(
//         new Event("paste", { bubbles: true, cancelable: true }),
//         {
//           clipboardData: {
//             getData: () => data,
//           },
//         },
//       );
//       $destination[0].dispatchEvent(pasteEvent);
//     });
//   });
//
//   return subject;
// });

// declare global {
//   namespace Cypress {
//     interface Chainable {
//       paste(): Chainable<JQuery<HTMLElement>>;
//     }
//   }
// }
