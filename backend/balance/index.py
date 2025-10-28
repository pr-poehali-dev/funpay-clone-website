'''
Business: Balance management - deposit funds and retrieve balance
Args: event with httpMethod, body, headers (X-User-Token, X-User-Id)
Returns: HTTP response with balance data or error
'''

import json
import os
from typing import Dict, Any
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Token, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = event.get('headers', {})
    user_token = headers.get('x-user-token') or headers.get('X-User-Token')
    user_id = headers.get('x-user-id') or headers.get('X-User-Id')
    
    if not user_token or not user_id:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute(
        "SELECT id, balance FROM users WHERE id = " + str(int(user_id)) + " AND session_token = '" + user_token.replace("'", "''") + "'"
    )
    user = cursor.fetchone()
    
    if not user:
        cursor.close()
        conn.close()
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Invalid session'})
        }
    
    if method == 'GET':
        cursor.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'balance': float(user['balance'])})
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        amount = body_data.get('amount', 0)
        
        if amount <= 0:
            cursor.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Invalid amount'})
            }
        
        cursor.execute(
            "UPDATE users SET balance = balance + " + str(float(amount)) + " WHERE id = " + str(int(user_id)) + " RETURNING balance"
        )
        conn.commit()
        result = cursor.fetchone()
        
        new_balance = float(result['balance'])
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'balance': new_balance})
        }
    
    cursor.close()
    conn.close()
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({'error': 'Method not allowed'})
    }
