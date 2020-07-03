const nock = require('nock');
const plugin = require('../index');

const mockParameters = {
    debug: jest.fn(),
    log: jest.fn()
};

describe('`transform()`', () => {
    test('replaces asset URLs in fields with different formats', async () => {
        const mock = nock('https://cdn.sanity.io')
            .get(/\.png$/)
            .reply(200);
        const data = {
            objects: [
                {
                    __metadata: {
                        id: 'author',
                        source: 'sourcebit-source-sanity',
                        modelName: 'author',
                        projectId: 'my-project-id',
                        projectEnvironment: 'my-dataset',
                        createdAt: '2020-01-29T14:48:14Z',
                        updatedAt: '2020-01-29T14:48:14Z'
                    },
                    imageAsAssetObject: {
                        __metadata: {
                            id: 'image-54944af18882e795452e43957aa43e004e4f8cfc-803x803-png',
                            source: 'sourcebit-source-sanity',
                            modelName: '__asset',
                            projectId: 'my-project-id',
                            projectEnvironment: 'my-dataset',
                            createdAt: '2020-01-29T14:48:13Z',
                            updatedAt: '2020-01-29T14:48:13Z'
                        },
                        contentType: 'image/png',
                        fileName: 'avatar.png',
                        url: 'https://cdn.sanity.io/images/kz6i252u/production/54944af18882e795452e43957aa43e004e4f8cfc-803x803.png'
                    },
                    imageAsString: 'https://cdn.sanity.io/images/kz6i252u/production/54944af18882e795452e43957aa43e004e4f8cfc-803x803.png',
                    imageInNestedObject: {
                        parent: {
                            child: 'https://cdn.sanity.io/images/kz6i252u/production/54944af18882e795452e43957aa43e004e4f8cfc-803x803.png'
                        },
                        too: {
                            deep: {
                                for: {
                                    me: {
                                        to: {
                                            go:
                                                'https://cdn.sanity.io/images/kz6i252u/production/54944af18882e795452e43957aa43e004e4f8cfc-803x803.png'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    email: 'email@example.com',
                    name: 'Stackbit Fresh',
                    stackbit_file_path: '_data/author.json',
                    stackbit_model_type: 'data'
                },
                {
                    __metadata: {
                        id: 'image-54944af18882e795452e43957aa43e004e4f8cfc-803x803-png',
                        source: 'sourcebit-source-sanity',
                        modelName: '__asset',
                        projectId: 'my-project-id',
                        projectEnvironment: 'my-dataset',
                        createdAt: '2020-01-29T14:48:13Z',
                        updatedAt: '2020-01-29T14:48:13Z'
                    },
                    contentType: 'image/png',
                    fileName: 'avatar.png',
                    url: 'https://cdn.sanity.io/images/kz6i252u/production/54944af18882e795452e43957aa43e004e4f8cfc-803x803.png'
                }
            ]
        };
        const { objects } = await plugin.transform({
            ...mockParameters,
            data,
            options: {
                assetPath: 'assets',
                maximumSearchDepth: 5,
                publicUrl: '/assets'
            }
        });

        expect(mock.isDone()).toBe(true);
        expect(objects[0].imageAsAssetObject).toBe('/assets/avatar.png');
        expect(objects[0].imageAsString).toBe('/assets/avatar.png');
        expect(objects[0].imageInNestedObject.parent.child).toBe('/assets/avatar.png');
        expect(objects[0].imageInNestedObject.too.deep.for.me.to.go).not.toBe('/assets/avatar.png');
    });
});
