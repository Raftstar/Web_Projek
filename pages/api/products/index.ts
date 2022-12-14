import apiHandler, { checkAuth } from '../../../lib/apiHandler'
import prisma from '../../../lib/prisma'

const app = apiHandler()

const createNewProduct = async ({ user, product }) => {
  const { title, price, category, subCategory } = product

  if (title == undefined || price == undefined) {
    throw { status: 400, message: 'Please provide title, price' }
  }

  const categoryDb = await prisma.category.findUnique({
    where: { slug: category },
    select: { logoImg: true, subCategories: true, isTopup: true },
  })

  // logic for topup category only
  if (categoryDb.isTopup) {
    const hasSubCategories = categoryDb.subCategories.length > 0

    // but subCategory not in req.body, throw 400
    if (hasSubCategories && !subCategory) {
      throw {
        status: 400,
        message: 'Please provide subCategory for this product',
      }
    }

    product.img = (
      hasSubCategories
        ? categoryDb.subCategories.find((sc) => sc.slug == subCategory)
        : categoryDb
    ).logoImg
  }

  if (subCategory) {
    product.subCategory = { connect: { slug: subCategory } }
  }

  return await prisma.product.create({
    data: {
      ...product,
      category: { connect: { slug: category } },
      user: { connect: { id: user.id } },
    },
    include: {
      subCategory: true,
    },
  })
}

export default app
  // get all products
  .get(async (req, res) => {
    const { category, from, to, discount, search, include } = req.query as {
      [key: string]: string
    }

    let includeQuery = {}
    if (include) {
      includeQuery = include.split(',').reduce((obj, prop) => {
        obj[prop] = true
        return obj
      }, {})
    }

    let products = await prisma.product.findMany({
      where: {
        price: { gte: from && +from, lte: to && +to },
        discount: { gt: discount == 'true' ? 0 : undefined },
        category: { slug: category },
      },
      include: includeQuery,
    })

    if (search) {
      products = products.filter((product) =>
        product.title.toLowerCase().includes(search.toLowerCase())
      )
    }

    res.status(200).json({ products, length: products.length })
  })

  // create new product
  .post(checkAuth('ADMIN'), async (req, res) => {
    if (Array.isArray(req.body)) {
      const products = await Promise.all(
        req.body.map((product) => createNewProduct({ user: req.user, product }))
      )
      res.status(201).json({ products, count: products.length })
      return
    }

    const product = await createNewProduct({
      user: req.user,
      product: req.body,
    })
    res.status(201).json({ product })
  })
