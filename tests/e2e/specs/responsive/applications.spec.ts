import { expect, test } from '../../fixtures'
import { documentOverflow, tableCardOverflow } from '../../support/layout'

test('keeps the application table usable at 320px', async ({
  page,
  applications,
}) => {
  await page.setViewportSize({ width: 320, height: 812 })
  await applications.open()
  await applications.addApplication('Globex', 'Senior Engineer')

  await applications.expectAddedColumnHidden()
  await applications.row('Globex', 'Senior Engineer').expectVisible()
  await applications.expectAddedLabel()

  await applications.toggleDescription('Globex', 'Senior Engineer')
  await applications.expectDescription('Build reliable systems.', true)

  expect({
    card: await tableCardOverflow(page),
    document: await documentOverflow(page),
  }).toEqual({ card: 0, document: 0 })
})
