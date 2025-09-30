import { createUser } from '../../../src/domain/entities/User';

describe('User Entity', () => {
  it('should create a user with monitoring disabled by default', () => {
    const userData = {
      id: '123456789',
      nome: 'John',
      sobrenome: 'Doe',
      username: 'johndoe',
      idioma: 'pt'
    };

    const user = createUser(userData);

    expect(user).toEqual({
      ...userData,
      ativo: false
    });
  });

  it('should have all required properties', () => {
    const user = createUser({
      id: '123456789',
      nome: 'John',
      sobrenome: 'Doe',
      username: 'johndoe',
      idioma: 'pt'
    });

    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('nome');
    expect(user).toHaveProperty('sobrenome');
    expect(user).toHaveProperty('username');
    expect(user).toHaveProperty('idioma');
    expect(user).toHaveProperty('ativo');
  });
});