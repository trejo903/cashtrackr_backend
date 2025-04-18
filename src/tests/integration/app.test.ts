import  request  from "supertest";
import server, { connectDB } from "../../server";
import { AuthController } from "../../controllers/AuthController";
import User from "../../models/User";
import * as authUtils from "../../utils/auth";
import * as jwtUtils from '../../utils/jwt'

describe('Authentication - create account',()=>{
    it('should display validation errors when form is empty',async()=>{
        const response = await request(server)
                                .post('/api/auth/create-account')
                                .send({})
        
        const createAccountMock = jest.spyOn(AuthController,'createAccount')
        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('errors')
        expect(response.body.errors).toHaveLength(3)

        expect(response.status).not.toBe(201)
        expect(response.body.errors).not.toHaveLength(2)
        expect(createAccountMock).not.toHaveBeenCalled()
    })
    it('should return 400 status code when the email is invalid',async()=>{
        const response = await request(server)
                                .post('/api/auth/create-account')
                                .send({
                                    "name":"Juan",
                                    "password":"12345678",
                                    "email":"not_valid_email"
                                })
        
        const createAccountMock = jest.spyOn(AuthController,'createAccount')
        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('errors')
        expect(response.body.errors).toHaveLength(1)

        expect(response.body.errors[0].msg).toBe('E-mail no valido')

        expect(response.status).not.toBe(201)
        expect(response.body.errors).not.toHaveLength(2)
        expect(createAccountMock).not.toHaveBeenCalled()
    })
    it('should return 400 status code when the password is less than 8 characters',async()=>{
        const response = await request(server)
                                .post('/api/auth/create-account')
                                .send({
                                    "name":"Juan",
                                    "password":"12345",
                                    "email":"test@test.com"
                                })
        
        const createAccountMock = jest.spyOn(AuthController,'createAccount')
        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('errors')
        expect(response.body.errors).toHaveLength(1)


        expect(response.body.errors[0].msg).toBe('El password es muy corto, minimo 8 caracteres')

        expect(response.status).not.toBe(201)
        expect(response.body.errors).not.toHaveLength(2)
        expect(createAccountMock).not.toHaveBeenCalled()
    })
    it('should register a new user successfully',async()=>{

        const userData={
            "name":"Juan",
            "password":"password23",
            "email":"test@test.com"
        }
        const response = await request(server)
                                .post('/api/auth/create-account')
                                .send(userData)
        
        expect(response.status).toBe(201)
        
        
        expect(response.status).not.toBe(400)
        expect(response.body).not.toHaveProperty('errors')
    },20000)
    it('should return 409 conflict when a user is already registered',async()=>{

        const userData={
            "name":"Juan",
            "password":"password23",
            "email":"test@test.com"
        }
        const response = await request(server)
                                .post('/api/auth/create-account')
                                .send(userData)
        

        expect(response.status).toBe(409)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toBe('El usuario ya esta registrado')
        
        expect(response.status).not.toBe(400)
        expect(response.status).not.toBe(201)
        expect(response.body).not.toHaveProperty('errors')
    },10000)
})

describe('Authentication - Account Confirmed with Token or token is not valid',()=>{
    it('should display error if token is empty',async()=>{
        const response = await request(server).post('/api/auth/confirm-account').send({token:'not_valid'})
        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('errors')
        expect(response.body.errors).toHaveLength(1)
        expect(response.body.errors[0].msg).toBe('Token no valido')
    })
    it('should display error if token doesnt exits',async()=>{
        const response = await request(server).post('/api/auth/confirm-account').send({token:'123456'})
        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toBe('Token no valido')
        expect(response.status).not.toBe(200)
    })
    it('should confirm account with a valid token',async()=>{
        const token = globalThis.crashTrackerConfirmationToken
        const response = await request(server).post('/api/auth/confirm-account').send({token})
       expect(response.status).toBe(200)
       expect(response.body).toBe('Cuenta confirmada correctamente')
       expect(response.status).not.toBe(401)
    })
})

describe('Authentication - Login',()=>{

    beforeEach(()=>{
        jest.clearAllMocks()
    })

    it('should display validation errors when the form is empty',async()=>{
        const response = await request(server).post('/api/auth/login').send({})

        const loginMock=jest.spyOn(AuthController,'login')

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('errors')
        expect(response.body.errors).toHaveLength(2)

        expect(response.body.errors).not.toHaveLength(1)
        expect(loginMock).not.toHaveBeenCalled()
    })
    it('should return 400 bad request when the email is invalid',async()=>{
        const response = await request(server).post('/api/auth/login').send({
            "password":"password",
            "email":"not_valid"
        })

        const loginMock=jest.spyOn(AuthController,'login')
        expect(response.body.errors[0].msg).toBe('Email no valido')
        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('errors')
        expect(response.body.errors).toHaveLength(1)

        expect(response.body.errors).not.toHaveLength(2)
        expect(loginMock).not.toHaveBeenCalled()
    })
    it('should return a 400 if the user is not found',async()=>{
        const response = await request(server).post('/api/auth/login').send({
            "password":"password",
            "email":"user_not_found@test.com"
        })

        expect(response.status).toBe(404)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toBe('El usuario no existe')

        expect(response.status).not.toBe(200)
    })
    it('should return a 403 error if the user account is not confirmed',async()=>{

        (jest.spyOn(User,'findOne') as jest.Mock).mockResolvedValue({
            id:1,
            confirmed:false,
            password:'hashedpassword',
            email:"user_not_confirmed@test.com"
        })

        const response = await request(server).post('/api/auth/login').send({
            "password":"password",
            "email":"user_not_confirmed@test.com"
        })

        expect(response.status).toBe(403)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toBe('Cuenta no ha sido confirmada')

        expect(response.status).not.toBe(200)
    },20000)
    it('should return a 403 error if the user account is not confirmed',async()=>{

        const userData={
            name:"test",
            password:'hashedpassword',
            email:"user_not_confirmed@test.com"
        }

        await request(server).post('/api/auth/create-account').send(userData)

        const response = await request(server).post('/api/auth/login').send({
            "password":userData.password,
            "email":userData.email
        })

        expect(response.status).toBe(403)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toBe('Cuenta no ha sido confirmada')

        expect(response.status).not.toBe(200)
    },20000)
    it('should return a 401 error if the password is incorrect',async()=>{

       const findOne= (jest.spyOn(User,'findOne') as jest.Mock).mockResolvedValue({
            id:1,
            confirmed:true,
            password:'hashedpassword'})

       const checkPassword =  jest.spyOn(authUtils,'checkPassword').mockResolvedValue(false)

        const response = await request(server).post('/api/auth/login').send({
            "password":"wrongpassword",
            "email":"test@test.com"
        })

        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toBe('Contraseña incorrecta')

        expect(response.status).not.toBe(200)
        expect(response.status).not.toBe(404)
        expect(response.status).not.toBe(403)


        expect(findOne).toHaveBeenCalledTimes(1)
        expect(checkPassword).toHaveBeenCalledTimes(1)

    },20000)
    it('should return a 401 error if the password is incorrect',async()=>{

        const findOne= (jest.spyOn(User,'findOne') as jest.Mock).mockResolvedValue({
             id:1,
             confirmed:true,
             password:'hashedpassword'})
 
        const checkPassword =  jest.spyOn(authUtils,'checkPassword').mockResolvedValue(true)
        const generateJWT = jest.spyOn(jwtUtils,'generateJWT').mockReturnValue('jwt_token')

 
         const response = await request(server).post('/api/auth/login').send({
             "password":"correctPassword",
             "email":"test@test.com"
         })
        expect(response.status).toBe(200)
        expect(response.body).toEqual('jwt_token')
         

        expect(findOne).toHaveBeenCalled()
        expect(findOne).toHaveBeenCalledTimes(1)

        expect(checkPassword).toHaveBeenCalled()
        expect(checkPassword).toHaveBeenCalledTimes(1)
        expect(checkPassword).toHaveBeenCalledWith('correctPassword','hashedpassword')

        expect(generateJWT).toHaveBeenCalled()
        expect(generateJWT).toHaveBeenCalledTimes(1)
        expect(generateJWT).toHaveBeenCalledWith(1)
 
     },20000)
})

let jwt:string;

async function authenticateUser() {
    const response = await request(server)
                                    .post('/api/auth/login')
                                    .send({
                                        email:"test@test.com",
                                        password:'password23'
                                    })
        jwt = response.body
        expect(response.status).toBe(200)
}

describe('Get /api/budgets',()=>{
   
    beforeAll(()=>{
        jest.restoreAllMocks()
    })
    beforeAll(async()=>{
        await authenticateUser()
    })
    it('should reject unauthenticated access to budgets without a jwt',async()=>{
        const response = await request(server)
                                    .get('/api/budgets')

        expect(response.status).toBe(401)
        expect(response.body.error).toBe('No autorizado')
    })
    it('should allow authenticated access to budgets with a valid jwt',async()=>{
        const response = await request(server)
                                    .get('/api/budgets')
                                    .auth(jwt,{type:'bearer'})


        expect(response.body).toHaveLength(0)
        expect(response.status).not.toBe(401)
        expect(response.body.error).not.toBe('No autorizado')
    })

    it('should reject unauthenticated access to budgets without a valid jwt',async()=>{
        const response = await request(server)
                                    .get('/api/budgets')
                                    .auth('not_valid',{type:'bearer'})

        expect(response.status).toBe(500)
        expect(response.body.error).toBe('Token no valido')
    })
})


describe('POST /api/budgets',()=>{
    beforeAll(async()=>{
        await authenticateUser()
    })


    it('should reject unauthenticated post request to budgets without a jwt',async()=>{
        const response = await request(server)
                                    .post('/api/budgets')

        expect(response.status).toBe(401)
        expect(response.body.error).toBe('No autorizado')
    })
})

describe('Get /api/budgets/:id',()=>{
    beforeAll(async()=>{
        await authenticateUser()
    })


    it('should reject unauthenticated get request to budget id without a jwt',async()=>{
        const response = await request(server)
                                    .get('/api/budgets/1')

        expect(response.status).toBe(401)
        expect(response.body.error).toBe('No autorizado')
    })


    it('should return 400 bad request when id is not valid',async()=>{
        const response = await request(server)
                                    .get('/api/budgets/not_valid')
                                    .auth(jwt,{type:'bearer'})

        expect(response.status).toBe(400)
        expect(response.body.errors).toBeDefined()
        expect(response.body.errors).toBeTruthy()
        expect(response.body.errors).toHaveLength(1)
        expect(response.body.errors[0].msg).toBe('ID no valido')


        expect(response.status).not.toBe(401)
        expect(response.body.error).not.toBe('No autorizado')
    })

    it('should return 404 not found when a budget doesnt exists',async()=>{
        const response = await request(server)
                                    .get('/api/budgets/3000')
                                    .auth(jwt,{type:'bearer'})

        expect(response.status).toBe(404)
        
        expect(response.body.error).toBe('Presupuesto no encontrado')


        expect(response.status).not.toBe(400)
        expect(response.status).not.toBe(401)
    })


    it('should return a single budget by id',async()=>{
        const response = await request(server)
                                    .get('/api/budgets/1')
                                    .auth(jwt,{type:'bearer'})

        expect(response.status).toBe(200)
        


        expect(response.status).not.toBe(400)
        expect(response.status).not.toBe(401)
        expect(response.status).not.toBe(404)
    })
})



describe('PUT /api/budgets/:id',()=>{
    beforeAll(async()=>{
        await authenticateUser()
    })


    it('should reject unauthenticated put request to budget id without a jwt',async()=>{
        const response = await request(server)
                                    .put('/api/budgets/1')

        expect(response.status).toBe(401)
        expect(response.body.error).toBe('No autorizado')
    })

    it('should display validation errors if the form is empty',async()=>{
        const response = await request(server)
                                    .put('/api/budgets/1')
                                    .auth(jwt,{type:'bearer'})
                                    .send({})

        expect(response.status).toBe(400)
        expect(response.body.errors).toBeTruthy()
        expect(response.body.errors).toHaveLength(4)

    })

    it('should update a budget by id and return a success message',async()=>{
        const response = await request(server)
                                    .put('/api/budgets/1')
                                    .auth(jwt,{type:'bearer'})
                                    .send({
                                        name:"Update Budget",
                                        amount:3000
                                    })

        expect(response.status).toBe(200)
        expect(response.body).toBe('presupuesto actualizado correctamente')

    })

})


describe('DELETE /api/budgets/:id',()=>{
    beforeAll(async()=>{
        await authenticateUser()
    })


    it('should reject unauthenticated put request to budget id without a jwt',async()=>{
        const response = await request(server)
                                    .delete('/api/budgets/1')

        expect(response.status).toBe(401)
        expect(response.body.error).toBe('No autorizado')
    })

    it('should return 404 not found when a budget doesnt exists',async()=>{
        const response = await request(server)
                                    .delete('/api/budgets/300')
                                    .auth(jwt,{type:'bearer'})

        expect(response.status).toBe(404)
        expect(response.body.error).toBe('Presupuesto no encontrado')

    })

    it('should delete a budget and return a success message ',async()=>{
        const response = await request(server)
                                    .delete('/api/budgets/1')
                                    .auth(jwt,{type:'bearer'})
                                    

        expect(response.status).toBe(200)
        expect(response.body).toBe('presupuesto eliminado')

    })

})