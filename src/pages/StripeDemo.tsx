import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}

const AVAILABLE_PRODUCTS: Product[] = [
  { id: 'prod_premium', name: 'Novaura Premium', price: 1500, description: 'Unlock all advanced AI features for 1 month.' },
  { id: 'prod_credits', name: '1000 AI Credits', price: 500, description: 'Pay-as-you-go credits for image and video generation.' },
  { id: 'prod_api', name: 'API Access Tier 1', price: 4900, description: 'Direct API access for developers.' },
];

export default function StripeDemo() {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [stripeKey, setStripeKey] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('novaura_api_keys');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.stripe) {
          setStripeKey(parsed.stripe);
        }
      } catch (e) {
        console.error('Failed to parse saved API keys');
      }
    }

    // Check for success/cancel in URL
    const query = new URLSearchParams(window.location.search);
    if (query.get('success')) {
      setSuccess(true);
    }
    if (query.get('canceled')) {
      setError("Order canceled. Continue shopping around and checkout when you're ready.");
    }
  }, []);

  const addToCart = (id: string) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[id] > 1) {
        newCart[id] -= 1;
      } else {
        delete newCart[id];
      }
      return newCart;
    });
  };

  const totalAmount = Object.entries(cart).reduce((total, [id, quantity]) => {
    const product = AVAILABLE_PRODUCTS.find(p => p.id === id);
    return total + (product ? product.price * quantity : 0);
  }, 0);

  const handleCheckout = async () => {
    if (!stripeKey) {
      setError("Please configure your Stripe API Key in the API Hub first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const items = Object.entries(cart).map(([id, quantity]) => {
        const product = AVAILABLE_PRODUCTS.find(p => p.id === id);
        return {
          name: product?.name || 'Unknown Item',
          price: product?.price || 0,
          quantity
        };
      });

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${stripeKey}`
        },
        body: JSON.stringify({ items })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle className="h-24 w-24 text-emerald-500" />
        </div>
        <h1 className="text-4xl font-bold text-zinc-50">Payment Successful!</h1>
        <p className="text-zinc-400 text-lg">
          Thank you for your purchase. Your Stripe integration is working perfectly.
        </p>
        <button
          onClick={() => {
            setSuccess(false);
            setCart({});
            window.history.replaceState({}, document.title, window.location.pathname);
          }}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50 flex items-center gap-3">
          <CreditCard className="h-8 w-8 text-indigo-500" />
          Stripe Integration Demo
        </h1>
        <p className="mt-2 text-zinc-400">
          A plug-and-play example of Stripe Checkout. Add items to your cart and test the payment flow using your configured Stripe API key.
        </p>
      </div>

      {!stripeKey && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-medium text-amber-500">Stripe Key Missing</h4>
            <p className="text-sm text-amber-500/80 mt-1">
              You need to add your Stripe Secret Key in the API Hub before you can test checkout.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-zinc-100">Available Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {AVAILABLE_PRODUCTS.map(product => (
              <div key={product.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col">
                <h3 className="font-medium text-zinc-200">{product.name}</h3>
                <p className="text-sm text-zinc-500 mt-1 flex-1">{product.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-semibold text-zinc-100">${(product.price / 100).toFixed(2)}</span>
                  <button
                    onClick={() => addToCart(product.id)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    <Plus size={16} />
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-fit sticky top-6">
          <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2 mb-6">
            <ShoppingCart size={20} />
            Your Cart
          </h2>

          {Object.keys(cart).length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8">Your cart is empty.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(cart).map(([id, quantity]) => {
                const product = AVAILABLE_PRODUCTS.find(p => p.id === id);
                if (!product) return null;
                return (
                  <div key={id} className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{product.name}</p>
                      <p className="text-xs text-zinc-500">${(product.price / 100).toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2 bg-zinc-950 rounded-md border border-zinc-800 p-1">
                      <button onClick={() => removeFromCart(id)} className="p-1 text-zinc-400 hover:text-zinc-200">
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-medium w-4 text-center">{quantity}</span>
                      <button onClick={() => addToCart(id)} className="p-1 text-zinc-400 hover:text-zinc-200">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}

              <div className="pt-4 border-t border-zinc-800 mt-4">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-zinc-400">Total</span>
                  <span className="text-xl font-bold text-zinc-100">${(totalAmount / 100).toFixed(2)}</span>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-md text-sm text-rose-400">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={loading || !stripeKey}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  {loading ? (
                    <span className="animate-pulse">Processing...</span>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      Checkout with Stripe
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
